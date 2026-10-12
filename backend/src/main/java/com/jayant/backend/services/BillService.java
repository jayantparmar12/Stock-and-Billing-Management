package com.jayant.backend.services;

import com.jayant.backend.DTO.BillItemRequest;
import com.jayant.backend.DTO.BillItemResponse;
import com.jayant.backend.DTO.BillRequest;
import com.jayant.backend.DTO.BillResponse;
import com.jayant.backend.Entity.*;
import com.jayant.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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

    @Transactional
    public BillResponse createBill(BillRequest request) {
        Customer customer = customerRepo.findById(request.getCustomer_id())
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer Not Found with id : "+request.getCustomer_id()
                )
        );
        if(request.getItems()==null || request.getItems().isEmpty()){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Empty Products Not Allowed"
            );
        }
        Bill bill = new Bill();
        bill.setTotalAmount(BigDecimal.valueOf(0.0));
        bill.setBillDate(LocalDateTime.now());
        bill.setCustomer(customer);
        bill = billRepo.save(bill);
        Double totalPrice = 0.0;
        List<BillItem> billItems = new ArrayList<>();
        List<BillItemResponse> billItemResponses = new ArrayList<>();
        for(BillItemRequest billItemRequest : request.getItems()) {
            Product product = productRepo.findById(billItemRequest.getProduct_id())
                    .orElseThrow(()->new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : "+billItemRequest.getProduct_id()
                    ));
            if(billItemRequest.getQuantity()==null || billItemRequest.getQuantity()<=0){
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than 0"
                );
            }
            if(product.getQuantity() < billItemRequest.getQuantity()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Insufficient stock"
                );
            }
            StockMovement stockMovement = stockMovementService.saveStock(product, MovementType.SALE, billItemRequest.getQuantity(), product.getQuantity(), product.getQuantity() - billItemRequest.getQuantity(), "Bill created");
            product.setQuantity(product.getQuantity()-billItemRequest.getQuantity());
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

        return billResponse;
    }

    public BillResponse getBillById(Integer id) {
        Bill bill = billRepo.findById(id)
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : "+id
                ));
        List<BillItem> billItems = billItemRepo.findByBillId(id);
        List<BillItemResponse> billItemResponses = new ArrayList<>();
        for(BillItem billItem : billItems) {
            BillItemResponse billItemResponse = new BillItemResponse();
            billItemResponse.setItemTotal(BigDecimal.valueOf(billItem.getUnitPrice().doubleValue()* billItem.getQuantity().doubleValue()));
            billItemResponse.setUnitPrice(billItem.getUnitPrice());
            billItemResponse.setQuantity(billItem.getQuantity());
            billItemResponse.setProductName(billItem.getProduct().getProduct());
            billItemResponses.add(billItemResponse);
        }
        BillResponse billResponse = new BillResponse();
        billResponse.setTotalAmount(bill.getTotalAmount());
        billResponse.setId(bill.getId());
        billResponse.setCustomer(bill.getCustomer());
        billResponse.setBillDate(bill.getBillDate());
        billResponse.setItems(billItemResponses);

        return billResponse;
    }

    public List<BillResponse> getAllBills() {
        List<Bill> bills = billRepo.findAll();
        List<BillResponse> billResponses = new ArrayList<>();

        for(Bill bill : bills) {
            List<BillItem> billItems = billItemRepo.findByBillId(bill.getId());
            List<BillItemResponse> billItemResponses = new ArrayList<>();
            BillResponse billResponse = new BillResponse();
            billResponse.setBillDate(bill.getBillDate());
            billResponse.setCustomer(bill.getCustomer());
            billResponse.setId(bill.getId());
            billResponse.setTotalAmount(bill.getTotalAmount());
            for(BillItem billItem : billItems) {
                BillItemResponse billItemResponse = new BillItemResponse();
                billItemResponse.setQuantity(billItem.getQuantity());
                billItemResponse.setProductName(billItem.getProduct().getProduct());
                billItemResponse.setUnitPrice(billItem.getUnitPrice());
                billItemResponse.setItemTotal(BigDecimal.valueOf(billItem.getUnitPrice().doubleValue()*billItem.getQuantity().doubleValue()));

                billItemResponses.add(billItemResponse);
            }
            billResponse.setItems(billItemResponses);
            billResponses.add(billResponse);
        }
        return billResponses;
    }

    public List<BillResponse> getBillByCustomerId(Integer id) {
        if(!customerRepo.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Customer Not Found with id : "+id
            );
        }
        List<BillResponse> billResponses = new ArrayList<>();
        List<Bill> bills = billRepo.findByCustomerId(id);
        for(Bill bill : bills) {
            List<BillItem> billItems = billItemRepo.findByBillId(bill.getId());
            List<BillItemResponse> billItemResponses = new ArrayList<>();
            BillResponse billResponse = new BillResponse();
            billResponse.setBillDate(bill.getBillDate());
            billResponse.setCustomer(bill.getCustomer());
            billResponse.setId(bill.getId());
            billResponse.setTotalAmount(bill.getTotalAmount());
            for(BillItem billItem : billItems) {
                BillItemResponse billItemResponse = new BillItemResponse();
                billItemResponse.setQuantity(billItem.getQuantity());
                billItemResponse.setProductName(billItem.getProduct().getProduct());
                billItemResponse.setUnitPrice(billItem.getUnitPrice());
                billItemResponse.setItemTotal(BigDecimal.valueOf(billItem.getUnitPrice().doubleValue()*billItem.getQuantity().doubleValue()));

                billItemResponses.add(billItemResponse);
            }
            billResponse.setItems(billItemResponses);
            billResponses.add(billResponse);
        }
        return billResponses;
    }

    public List<BillResponse> getBillBetweenDate(LocalDateTime start, LocalDateTime end) {
        List<BillResponse> billResponses = new ArrayList<>();
        List<Bill> bills = billRepo.findByBillDateBetween(start, end);
        if(bills.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Bills Not Found between range "+start+" "+end
            );
        }
        for(Bill bill : bills) {
            List<BillItem> billItems = billItemRepo.findByBillId(bill.getId());
            List<BillItemResponse> billItemResponses = new ArrayList<>();
            BillResponse billResponse = new BillResponse();
            billResponse.setBillDate(bill.getBillDate());
            billResponse.setCustomer(bill.getCustomer());
            billResponse.setId(bill.getId());
            billResponse.setTotalAmount(bill.getTotalAmount());
            for(BillItem billItem : billItems) {
                BillItemResponse billItemResponse = new BillItemResponse();
                billItemResponse.setQuantity(billItem.getQuantity());
                billItemResponse.setProductName(billItem.getProduct().getProduct());
                billItemResponse.setUnitPrice(billItem.getUnitPrice());
                billItemResponse.setItemTotal(BigDecimal.valueOf(billItem.getUnitPrice().doubleValue()*billItem.getQuantity().doubleValue()));

                billItemResponses.add(billItemResponse);
            }
            billResponse.setItems(billItemResponses);
            billResponses.add(billResponse);
        }
        return billResponses;
    }

    public List<BillResponse> getBillByCustomerName(String name) {
        List<BillResponse> billResponses = new ArrayList<>();
        List<Bill> bills = billRepo.findByCustomer_NameContainingIgnoreCase(name);
        for(Bill bill : bills) {
            List<BillItem> billItems = billItemRepo.findByBillId(bill.getId());
            List<BillItemResponse> billItemResponses = new ArrayList<>();
            BillResponse billResponse = new BillResponse();
            billResponse.setBillDate(bill.getBillDate());
            billResponse.setCustomer(bill.getCustomer());
            billResponse.setId(bill.getId());
            billResponse.setTotalAmount(bill.getTotalAmount());
            for(BillItem billItem : billItems) {
                BillItemResponse billItemResponse = new BillItemResponse();
                billItemResponse.setQuantity(billItem.getQuantity());
                billItemResponse.setProductName(billItem.getProduct().getProduct());
                billItemResponse.setUnitPrice(billItem.getUnitPrice());
                billItemResponse.setItemTotal(BigDecimal.valueOf(billItem.getUnitPrice().doubleValue()*billItem.getQuantity().doubleValue()));

                billItemResponses.add(billItemResponse);
            }
            billResponse.setItems(billItemResponses);
            billResponses.add(billResponse);
        }
        return billResponses;
    }

    @Transactional
    public void cancelBill(Integer id) {
        Bill bill = billRepo.findById(id)
                .orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : "+id
                ));
        if(bill.getStatus()== BillStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bill already cancelled"
            );
        }
        List<BillItem> billItems = billItemRepo.findByBillId(id);
        for(BillItem billItem : billItems) {
            Product product = productRepo.findById(billItem.getProduct().getId())
                    .orElseThrow(()->new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product Not Found with id : "+billItem.getProduct().getId()
                    ));
            stockMovementService.saveStock(product, MovementType.BILL_CANCELLATION, billItem.getQuantity(), product.getQuantity(), billItem.getQuantity()+ product.getQuantity(), "Bill Cancel");
            product.setQuantity(product.getQuantity()+billItem.getQuantity());
        }
        bill.setStatus(BillStatus.CANCELLED);
        if (bill.getPaidAmount() != null &&
                bill.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {

            Refund refund = new Refund();
            refund.setAmount(bill.getPaidAmount());
            refund.setBill(bill);
            refund.setRefundDate(LocalDateTime.now());

            refundRepo.save(refund);
        }

        billRepo.save(bill);
    }

    @Transactional
    public void updatePayment(Integer id, BigDecimal payment) {
        Bill bill = billRepo.findById(id)
                .orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bill Not Found with id : "+id
                ));
        if(bill.getStatus()==BillStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Bill was cancelled"
            );
        }
        if(bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment already paid"
            );
        }
        if (payment == null || payment.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment must be greater than 0"
            );
        }
        BigDecimal remaining = bill.getTotalAmount().subtract(bill.getPaidAmount());
        if (payment.compareTo(remaining) > 0){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment must not exceed remaining amount"
            );
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
    }

    public List<Payment> getPaymentByBill(Integer id) {
        if(!billRepo.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Bill Not Found with id : "+id
            );
        }
        return paymentRepo.findByBillId(id);
    }

    public List<Refund> getRefundHistory(Integer id) {
        if(!billRepo.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Bill Not Found with id : "+id
            );
        }
        return refundRepo.findByBillId(id);
    }
}
