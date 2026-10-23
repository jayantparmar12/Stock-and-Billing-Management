import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  TrendingUp,
  TrendingDown,
  Package,
  CalendarDays,
  Eye,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import "./StockHistory.css";
import api from "../../services/api";

function formatDate(dateString) {
  if (!dateString) return "—";
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return String(dateString);

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeProduct(raw) {
  if (!raw) return null;
  const categoryName =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.name ?? ""
      : String(raw.category ?? "");

  return {
    id: raw.id,
    name: raw.name ?? raw.product ?? `Product #${raw.id}`,
    category: categoryName,
    price: Number(raw.price ?? 0),
    quantity: Number(raw.quantity ?? 0),
  };
}

/**
 * Maps backend StockMovement entity:
 * { id, product, movementType, quantity, previousStock, newStock, movementDate, reason }
 */
function normalizeMovement(raw, fallbackProduct) {
  const prodObj = raw.product
    ? normalizeProduct(raw.product)
    : fallbackProduct || { id: 0, name: "Product", category: "" };

  const previousStock = Number(raw.previousStock ?? 0);
  const newStock = Number(raw.newStock ?? raw.currentStock ?? 0);
  const quantity = Number(raw.quantity ?? Math.abs(newStock - previousStock));
  const movementType = String(raw.movementType ?? raw.type ?? "ADJUSTMENT").toUpperCase();

  // Determine whether stock increased (IN) or decreased (OUT)
  const isIncrease =
    newStock > previousStock ||
    movementType === "STOCK_IN" ||
    movementType === "BILL_CANCELLATION" ||
    movementType === "IN";

  const direction = isIncrease ? "IN" : "OUT";

  return {
    id: raw.id ?? `${prodObj.id}-${raw.movementDate}`,
    productId: prodObj.id,
    productName: prodObj.name,
    categoryName: prodObj.category || "Uncategorized",
    sku: `PRD-${String(prodObj.id ?? 0).padStart(3, "0")}`,
    movementType,
    direction,
    quantity,
    previousStock,
    newStock,
    reason: raw.reason || "—",
    movementDate: raw.movementDate ?? raw.date ?? null,
    reference: `MOV-${String(raw.id ?? 0).padStart(4, "0")}`,
  };
}

function getMovementLabel(movementType) {
  switch (movementType) {
    case "STOCK_IN":
      return "Stock In";
    case "SALE":
      return "Bill Sale";
    case "ADJUSTMENT":
      return "Adjustment";
    case "BILL_CANCELLATION":
      return "Bill Cancelled";
    default:
      return movementType;
  }
}

export default function StockHistory() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [reasonFilter, setReasonFilter] = useState("ALL");

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch products and their stock movement histories (GET /api/products & GET /api/products/{id}/stock-history)
  const fetchAllStockHistory = useCallback(async (selectedProdId = "ALL") => {
    try {
      setLoading(true);
      setError("");

      const productsRes = await api.get("/api/products");
      if (!productsRes.data?.success || !Array.isArray(productsRes.data.data)) {
        setError(productsRes.data?.message || "Unable to load products.");
        setLoading(false);
        return;
      }

      const normalizedProducts = productsRes.data.data.map(normalizeProduct);
      setProducts(normalizedProducts);

      const targetProducts =
        selectedProdId === "ALL"
          ? normalizedProducts
          : normalizedProducts.filter(
              (p) => String(p.id) === String(selectedProdId)
            );

      const historyResponses = await Promise.allSettled(
        targetProducts.map((prod) =>
          api
            .get(`/api/products/${prod.id}/stock-history`)
            .then((res) => ({ prod, data: res.data }))
        )
      );

      const allMovements = [];
      historyResponses.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.data?.success &&
          Array.isArray(result.value.data.data)
        ) {
          const { prod, data } = result.value;
          data.data.forEach((entry) => {
            allMovements.push(normalizeMovement(entry, prod));
          });
        }
      });

      // Sort newest first by movementDate (and id descending as tie-breaker)
      allMovements.sort((a, b) => {
        const timeA = a.movementDate ? new Date(a.movementDate).getTime() : 0;
        const timeB = b.movementDate ? new Date(b.movementDate).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      });

      setHistory(allMovements);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to connect to backend to load stock history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStockHistory("ALL");
  }, [fetchAllStockHistory]);

  const handleProductFilterChange = (value) => {
    setProductFilter(value);
    fetchAllStockHistory(value);
  };

  // Unique reasons dynamically derived from backend records
  const availableReasons = useMemo(() => {
    const set = new Set();
    history.forEach((item) => {
      if (item.reason && item.reason !== "—") {
        set.add(item.reason);
      }
    });
    return Array.from(set);
  }, [history]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesSearch =
        !query ||
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query) ||
        item.reason.toLowerCase().includes(query) ||
        item.reference.toLowerCase().includes(query) ||
        item.movementType.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" ||
        item.direction === typeFilter ||
        item.movementType === typeFilter;

      const matchesReason =
        reasonFilter === "ALL" || item.reason === reasonFilter;

      return matchesSearch && matchesType && matchesReason;
    });
  }, [history, search, typeFilter, reasonFilter]);

  // Summary Stats (computed from currently loaded history)
  const stats = useMemo(() => {
    const stockIn = filteredHistory
      .filter((item) => item.direction === "IN")
      .reduce((total, item) => total + item.quantity, 0);

    const stockOut = filteredHistory
      .filter((item) => item.direction === "OUT")
      .reduce((total, item) => total + item.quantity, 0);

    return {
      totalTransactions: filteredHistory.length,
      stockIn,
      stockOut,
      netChange: stockIn - stockOut,
    };
  }, [filteredHistory]);

  return (
    <div className="stock-history-page">
      <div className="stock-history-heading">
        <div>
          <h1>Stock History</h1>
          <p>
            Track every stock addition, adjustment, bill sale, and cancellation
            across your inventory.
          </p>
        </div>

        <div className="history-heading-actions">
          <button
            type="button"
            className="history-refresh-btn"
            onClick={() => fetchAllStockHistory(productFilter)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>

          <div className="history-heading-icon">
            <History size={22} />
          </div>
        </div>
      </div>

      {error && (
        <div className="history-error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon total">
            <History size={21} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{stats.totalTransactions}</h2>
            <span>Recorded movements</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon stock-in">
            <ArrowDownToLine size={21} />
          </div>
          <div>
            <p>Total Stock In</p>
            <h2>+{stats.stockIn}</h2>
            <span>Units added / restored</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon stock-out">
            <ArrowUpFromLine size={21} />
          </div>
          <div>
            <p>Total Stock Out</p>
            <h2>-{stats.stockOut}</h2>
            <span>Units sold / deducted</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon net-change">
            {stats.netChange >= 0 ? (
              <TrendingUp size={21} />
            ) : (
              <TrendingDown size={21} />
            )}
          </div>
          <div>
            <p>Net Stock Change</p>
            <h2>
              {stats.netChange > 0 ? "+" : ""}
              {stats.netChange}
            </h2>
            <span>Net units changed</span>
          </div>
        </div>
      </div>

      <div className="history-table-card">
        <div className="history-table-header">
          <div>
            <h2>Movement Records</h2>
            <p>
              {productFilter === "ALL"
                ? "Showing movements across all products"
                : `Showing movements for Product #${productFilter}`}
            </p>
          </div>

          <span className="history-record-count">
            {filteredHistory.length} records
          </span>
        </div>

        <div className="history-filters">
          <div className="history-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search product, SKU, reason, movement ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={productFilter}
            onChange={(event) => handleProductFilterChange(event.target.value)}
            aria-label="Filter by product"
          >
            <option value="ALL">All Products</option>
            {products.map((prod) => (
              <option key={prod.id} value={String(prod.id)}>
                {prod.name} (#{prod.id})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by movement type"
          >
            <option value="ALL">All Movement Types</option>
            <option value="IN">All Stock In (+)</option>
            <option value="OUT">All Stock Out (-)</option>
            <option value="STOCK_IN">STOCK_IN (Manual Add)</option>
            <option value="SALE">SALE (Bill Created)</option>
            <option value="ADJUSTMENT">ADJUSTMENT (Manual Deduct)</option>
            <option value="BILL_CANCELLATION">
              BILL_CANCELLATION (Restored)
            </option>
          </select>

          <select
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value)}
            aria-label="Filter by reason"
          >
            <option value="ALL">All Reasons</option>
            {availableReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Stock Change</th>
                <th>Reason</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="history-empty-state">
                      <RefreshCw size={26} className="spin-icon" />
                      <strong>Loading stock movement history...</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="history-row"
                    onClick={() => setSelectedRecord(item)}
                  >
                    <td>
                      <span className="history-reference">
                        {item.reference}
                      </span>
                    </td>

                    <td>
                      <div className="history-product-cell">
                        <div className="history-product-icon">
                          <Package size={19} />
                        </div>
                        <div>
                          <strong>{item.productName}</strong>
                          <span>
                            {item.sku} • {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`movement-badge ${
                          item.direction === "IN"
                            ? "movement-in"
                            : "movement-out"
                        }`}
                      >
                        {item.direction === "IN" ? (
                          <ArrowDownToLine size={14} />
                        ) : (
                          <ArrowUpFromLine size={14} />
                        )}
                        {getMovementLabel(item.movementType)}
                      </span>
                    </td>

                    <td>
                      <strong
                        className={
                          item.direction === "IN"
                            ? "quantity-positive"
                            : "quantity-negative"
                        }
                      >
                        {item.direction === "IN" ? "+" : "-"}
                        {item.quantity}
                      </strong>
                    </td>

                    <td>
                      <div className="stock-change-cell">
                        <span>{item.previousStock}</span>
                        <span className="stock-change-arrow">→</span>
                        <strong>{item.newStock}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="history-reason">{item.reason}</span>
                    </td>

                    <td>
                      <div className="history-date-cell">
                        <CalendarDays size={15} />
                        <span>{formatDate(item.movementDate)}</span>
                      </div>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="history-view-button"
                        title="View movement details"
                        aria-label={`View ${item.productName} movement details`}
                        onClick={() => setSelectedRecord(item)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="history-empty-state">
                      <History size={30} />
                      <strong>No stock movements found</strong>
                      <span>
                        Try changing your product, movement type, or search
                        filters.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="history-table-footer">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      </div>

      {/* Movement Details Modal */}
      {selectedRecord && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="history-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <h2>Movement Details</h2>
                <p>Reference: {selectedRecord.reference}</p>
              </div>

              <button
                type="button"
                className="history-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="history-detail-product">
              <div className="history-product-icon large">
                <Package size={24} />
              </div>
              <div>
                <h3>{selectedRecord.productName}</h3>
                <p>
                  {selectedRecord.sku} • {selectedRecord.categoryName}
                </p>
              </div>
              <span
                className={`movement-badge ${
                  selectedRecord.direction === "IN"
                    ? "movement-in"
                    : "movement-out"
                }`}
              >
                {getMovementLabel(selectedRecord.movementType)}
              </span>
            </div>

            <div className="history-detail-grid">
              <div>
                <span>Movement Type</span>
                <strong>{selectedRecord.movementType}</strong>
              </div>

              <div>
                <span>Quantity Changed</span>
                <strong
                  className={
                    selectedRecord.direction === "IN"
                      ? "quantity-positive"
                      : "quantity-negative"
                  }
                >
                  {selectedRecord.direction === "IN" ? "+" : "-"}
                  {selectedRecord.quantity} units
                </strong>
              </div>

              <div>
                <span>Previous Stock</span>
                <strong>{selectedRecord.previousStock} units</strong>
              </div>

              <div>
                <span>New Stock</span>
                <strong>{selectedRecord.newStock} units</strong>
              </div>

              <div>
                <span>Reason</span>
                <strong>{selectedRecord.reason}</strong>
              </div>

              <div>
                <span>Date & Time</span>
                <strong>{formatDate(selectedRecord.movementDate)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="history-modal-done"
              onClick={() => setSelectedRecord(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}