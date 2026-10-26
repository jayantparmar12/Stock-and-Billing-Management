package com.jayant.backend.services;

import com.jayant.backend.DTO.*;
import com.jayant.backend.Entity.*;
import com.jayant.backend.repository.*;
import com.jayant.backend.security.CurrentUserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepo billRepo;
    private final CustomerRepo customerRepo;
    private final ProductRepo productRepo;
    private final BillItemRepo billItemRepo;
    private final PaymentRepo paymentRepo;
    private final RefundRepo refundRepo;
    private final StockMovementService stockMovementService;
    private final CurrentUserService currentUserService;

    @Transactional
    public ApiResponse<BillResponse> createBill(BillRequest request) {
        Shop currentShop = currentUserService.getCurrentShop();

        Customer customer = customerRepo.findById(request.getCustomer_id())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer Not Found with id : " + request.getCustomer_id()
                ));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty Products Not Allowed");
        }

        Bill bill = new Bill();
        bill.setTotalAmount(BigDecimal.valueOf(0.0));
        bill.setBillDate(LocalDateTime.now());
        bill.setCustomer(customer);
        bill.setShop(currentShop);
        bill = billRepo.save(bill);

        Double totalPrice = 0.0;
        List<BillItem> billItems = new ArrayList<>();
        List<BillItemResponse> billItemResponses = new ArrayList<>();

        for (BillItemRequest billItemRequest : request.getItems()) {
            Product product = productRepo.findByIdAndShopId(billItemRequest.getProduct_id(), currentShop.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : " + billItemRequest.getProduct_id()
                    ));

            if (billItemRequest.getQuantity() == null || billItemRequest.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than 0");
            }
            if (product.getQuantity() < billItemRequest.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock");
            }

            stockMovementService.saveStock(
                    product,
                    MovementType.SALE,
                    billItemRequest.getQuantity(),
                    product.getQuantity(),
                    product.getQuantity() - billItemRequest.getQuantity(),
                    "Bill created"
            );
            product.setQuantity(product.getQuantity() - billItemRequest.getQuantity());
            productRepo.save(product);
            totalPrice += billItemRequest.getQuantity() * product.getPrice();

            BillItemResponse billItemResponse = new BillItemResponse();
            billItemResponse.setProductName(product.getProduct());
            billItemResponse.setQuantity(billItemRequest.getQuantity());
            billItemResponse.setUnitPrice(BigDecimal.valueOf(product.getPrice()));
            billItemResponse.setItemTotal(BigDecimal.valueOf(billItemRequest.getQuantity() * product.getPrice()));
            billItemResponses.add(billItemResponse);

            BillItem billItem = new BillItem();
            billItem.setBill(bill);
            billItem.setProduct(product);
            billItem.setQuantity(billItemRequest.getQuantity());
            billItem.setUnitPrice(BigDecimal.valueOf(product.getPrice()));
            billItems.add(billItem);
        }

        bill.setTotalAmount(BigDecimal.valueOf(totalPrice));
        billItemRepo.saveAll(billItems);
        billRepo.save(bill);

        BillResponse billResponse = new BillResponse();
        billResponse.setBillDate(bill.getBillDate());
        billResponse.setCustomer(bill.getCustomer());
        billResponse.setId(bill.getId());
        billResponse.setTotalAmount(bill.getTotalAmount());
        billResponse.setItems(billItemResponses);

        return new ApiResponse<>(true, "Bill Created Successfully", billResponse);
    }

    public ApiResponse<BillResponse> getBillById(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Bill bill = billRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : " + id
                ));

        return new ApiResponse<>(true, "Bill with id : " + id, mapBillToResponse(bill));
    }

    public ApiResponse<List<BillResponse>> getAllBills() {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Bill> bills = billRepo.findByShopId(shopId);
        List<BillResponse> billResponses = new ArrayList<>();
        for (Bill bill : bills) {
            billResponses.add(mapBillToResponse(bill));
        }
        return new ApiResponse<>(true, "List of Bills", billResponses);
    }

    public ApiResponse<List<BillResponse>> getBillByCustomerId(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Bill> bills = billRepo.findByShopIdAndCustomerId(shopId, id);
        List<BillResponse> billResponses = new ArrayList<>();
        for (Bill bill : bills) {
            billResponses.add(mapBillToResponse(bill));
        }
        return new ApiResponse<>(true, "List of Bill according to customer id : " + id, billResponses);
    }

    public ApiResponse<List<BillResponse>> getBillBetweenDate(LocalDateTime start, LocalDateTime end) {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Bill> bills = billRepo.findByShopIdAndBillDateBetween(shopId, start, end);
        if (bills.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Bills Not Found between range " + start + " " + end
            );
        }
        List<BillResponse> billResponses = new ArrayList<>();
        for (Bill bill : bills) {
            billResponses.add(mapBillToResponse(bill));
        }
        return new ApiResponse<>(true, "List of bill with in range", billResponses);
    }

    public ApiResponse<List<BillResponse>> getBillByCustomerName(String name) {
        Integer shopId = currentUserService.getCurrentShopId();
        List<Bill> bills = billRepo.findByShopIdAndCustomer_NameContainingIgnoreCase(shopId, name);
        List<BillResponse> billResponses = new ArrayList<>();
        for (Bill bill : bills) {
            billResponses.add(mapBillToResponse(bill));
        }
        return new ApiResponse<>(true, "List of bills according to customer name : " + name, billResponses);
    }

    @Transactional
    public ApiResponse<Void> cancelBill(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        Bill bill = billRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : " + id
                ));

        if (bill.getStatus() == BillStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bill already cancelled");
        }

        List<BillItem> billItems = billItemRepo.findByBillId(id);
        for (BillItem billItem : billItems) {
            Product product = productRepo.findById(billItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : " + billItem.getProduct().getId()
                    ));
            stockMovementService.saveStock(
                    product,
                    MovementType.BILL_CANCELLATION,
                    billItem.getQuantity(),
                    product.getQuantity(),
                    billItem.getQuantity() + product.getQuantity(),
                    "Bill Cancel"
            );
            product.setQuantity(product.getQuantity() + billItem.getQuantity());
            productRepo.save(product);
        }

        bill.setStatus(BillStatus.CANCELLED);
        if (bill.getPaidAmount() != null && bill.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            Refund refund = new Refund();
            refund.setAmount(bill.getPaidAmount());
            refund.setBill(bill);
            refund.setRefundDate(LocalDateTime.now());
            refundRepo.save(refund);
        }

        billRepo.save(bill);
        return new ApiResponse<>(true, "Bill Cancelled Successfully", null);
    }

    @Transactional
    public ApiResponse<Void> updatePayment(Integer id, BigDecimal payment) {
        Integer shopId = currentUserService.getCurrentShopId();
        Bill bill = billRepo.findByIdAndShopId(id, shopId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : " + id
                ));

        if (bill.getStatus() == BillStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bill was cancelled");
        }
        if (bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment already paid");
        }
        if (payment == null || payment.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment must be greater than 0");
        }

        BigDecimal remaining = bill.getTotalAmount().subtract(bill.getPaidAmount());
        if (payment.compareTo(remaining) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment must not exceed remaining amount");
        }

        Payment obj = new Payment();
        obj.setAmount(payment);
        obj.setBill(bill);
        obj.setPaymentDate(LocalDateTime.now());

        BigDecimal newPaidAmount = bill.getPaidAmount().add(payment);
        bill.setPaidAmount(newPaidAmount);
        if (newPaidAmount.compareTo(bill.getTotalAmount()) == 0) {
            bill.setPaymentStatus(PaymentStatus.PAID);
        } else {
            bill.setPaymentStatus(PaymentStatus.PARTIAL);
        }

        paymentRepo.save(obj);
        billRepo.save(bill);

        return new ApiResponse<>(true, "Payment updated successfully", null);
    }

    public ApiResponse<List<Payment>> getPaymentByBill(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        if (!billRepo.existsByIdAndShopId(id, shopId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill Not Found with id : " + id);
        }
        return new ApiResponse<>(true, "List of payment of bill id : " + id, paymentRepo.findByBillId(id));
    }

    public ApiResponse<List<Refund>> getRefundHistory(Integer id) {
        Integer shopId = currentUserService.getCurrentShopId();
        if (!billRepo.existsByIdAndShopId(id, shopId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill Not Found with id : " + id);
        }
        return new ApiResponse<>(true, "Refund history of bill id : " + id, refundRepo.findByBillId(id));
    }

    private BillResponse mapBillToResponse(Bill bill) {
        List<BillItem> billItems = billItemRepo.findByBillId(bill.getId());
        List<BillItemResponse> billItemResponses = new ArrayList<>();

        for (BillItem billItem : billItems) {
            BillItemResponse billItemResponse = new BillItemResponse();
            billItemResponse.setQuantity(billItem.getQuantity());
            billItemResponse.setProductName(billItem.getProduct().getProduct());
            billItemResponse.setUnitPrice(billItem.getUnitPrice());
            billItemResponse.setItemTotal(
                    BigDecimal.valueOf(billItem.getUnitPrice().doubleValue() * billItem.getQuantity().doubleValue())
            );
            billItemResponses.add(billItemResponse);
        }

        BillResponse billResponse = new BillResponse();
        billResponse.setId(bill.getId());
        billResponse.setBillDate(bill.getBillDate());
        billResponse.setCustomer(bill.getCustomer());
        billResponse.setTotalAmount(bill.getTotalAmount());
        // FIX: Yeh 3 fields bhejna zaroori hai taaki Dashboard Graph, Billing, aur Payments ko CANCELLED/PAID status mile!
        billResponse.setPaidAmount(bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO);
        billResponse.setStatus(bill.getStatus() != null ? bill.getStatus() : BillStatus.ACTIVE);
        billResponse.setPaymentStatus(bill.getPaymentStatus() != null ? bill.getPaymentStatus() : PaymentStatus.UNPAID);
        billResponse.setItems(billItemResponses);
        return billResponse;
    }
}
