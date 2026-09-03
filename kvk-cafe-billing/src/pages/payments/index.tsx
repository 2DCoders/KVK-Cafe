import { getAllMenuItems } from "@/services/cafe-menu-api";
import { getPayments, pay } from "@/services/payments-api";

import {
  ArrowLeft,
  BadgePercent,
  Banknote,
  Check,
  ChevronDown,
  Coffee,
  CreditCard,
  Eye,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

/* =========================================================
  Cafe Menu Types
  ========================================================= */

type Food = {
  id: string;
  name: string;
  category: number;
  price: number;
};

/* =========================================================
   Payment Response Types
   ========================================================= */

type PaymentOrderItem = {
  menuId: string;
  menuName?: string;
  quantity: number;
  price: number;
  discount: number;
};

type CafePaymentPayload = {
  CustomerName: string;
  CustomerPhone: string;
  totalMinutesSpent: number;
  isPaid: boolean;
  paymentMethod: 1 | 2;
  orderType: number;
  remark: string;
  address: string;
  deliveryInstructions: string;
  deliveryTime: string;
  deliveryPerson: string;
  deliveryPersonPhone: string;
  tableNumber: string;
  orderItems: PaymentOrderItem[];
};

type PaymentRecord = {
  id?: string;
  cafeOrderId?: string;
  orderNumber: string;
  orderDate: string;

  customerName: string;
  customerPhone: string;

  totalMinutesSpent: number;

  subTotalAmount: number;
  discount: number;
  discountedTotalAmount: number;

  isPaid: boolean;

  paymentMethod: number;
  orderType: number;
  orderStatus?: number;
  orderItems?: PaymentOrderItem[];
};

/* =========================================================
   Form Types
   ========================================================= */

type PaymentForm = {
  customerName: string;
  customerPhone: string;
  orderType: 1 | 2 | 3 | 4 | 5 | 6;
  tableNumber: string;
  address: string;
  deliveryInstructions: string;
  discount: string;
  paymentMethod: 1 | 2;
};

const OrderType = {
  DineIn: 1,
  TakeAway: 2,
};

const OrderTypes = [
  { value: OrderType.DineIn, label: "Dine In" },
  { value: OrderType.TakeAway, label: "Take Away" },
];

type SelectedItem = Food;

type AlertState = {
  visible: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
};

/* =========================================================
   Initial Form
   ========================================================= */

const initialForm: PaymentForm = {
  customerName: "",
  customerPhone: "",
  orderType: 1,
  tableNumber: "",
  address: "",
  deliveryInstructions: "",
  discount: "0",

  // 1 = Cash
  // 2 = Card
  paymentMethod: 1,
};

const getOrderTypeName = (orderType: number) => {
  return OrderTypes.find((order) => order.value === orderType)?.label ?? "-";
};

/* =========================================================
   Main Component
   ========================================================= */

export default function Payments() {
  /* =======================================================
     Page View
     ======================================================= */

  const [pageView, setPageView] = useState<"list" | "add">("list");

  /* =======================================================
     Payment List
     ======================================================= */

  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [paymentSearch, setPaymentSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );

  /* =======================================================
    Menu Items
     ======================================================= */

  const [foods, setFoods] = useState<Food[]>([]);

  const [selectedIds, setselectedIds] = useState<string[]>([]);

  /* =======================================================
     Payment Form
     ======================================================= */

  const [form, setForm] = useState<PaymentForm>(initialForm);

  const [isFoodsLoading, setIsFoodsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<CafePaymentPayload | null>(null);

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");

  const [pageAlert, setPageAlert] = useState<AlertState>({
    visible: false,
    variant: "success",
    title: "",
    description: "",
  });

  const navigate = useNavigate();

  const dayendData = localStorage.getItem("dayEndData")
    ? JSON.parse(localStorage.getItem("dayEndData") as string)
    : null;

  useEffect(() => {
    if (!dayendData) {
      navigate("/dayend");
    }
  }, [dayendData]);

  const selectorRef = useRef<HTMLDivElement | null>(null);

  /* =========================================================
     Load Payments
     ========================================================= */

  const getAllPayments = async () => {
    try {
      setIsPaymentsLoading(true);

      const res = await getPayments();

      setPayments(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error fetching payments:", error);

      setPayments([]);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to load payments",
        description: "An error occurred while loading cafe payment records.",
      });
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  useEffect(() => {
    void getAllPayments();
  }, []);

  /* =========================================================
    Load Menu Items
     ========================================================= */

  const getAllFoods = async () => {
    try {
      setIsFoodsLoading(true);

      const res = await getAllMenuItems();

      setFoods(res);
    } catch (error) {
      setFoods([]);
      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to load data",
        description: "An error occurred while loading cafe payment records.",
      });
    } finally {
      setIsFoodsLoading(false);
    }
  };

  /* =========================================================
     Open Add Payment View
     ========================================================= */

  const handleOpenAddPayment = async () => {
    setPageView("add");

    if (foods.length === 0) {
      await getAllFoods();
    }
  };

  /* =========================================================
     Back To Payments
     ========================================================= */

  const handleBackToPayments = () => {
    setPageView("list");
    setIsSelectorOpen(false);
  };

  /* =========================================================
     Auto Close Alert
     ========================================================= */

  useEffect(() => {
    if (!pageAlert.visible) return;

    const timer = setTimeout(() => {
      setPageAlert((previous) => ({
        ...previous,
        visible: false,
      }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [pageAlert.visible]);

  /* =========================================================
     Close Selector Outside
     ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =========================================================
     Formatting
     ========================================================= */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("en-LK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getPaymentMethodName = (paymentMethod: number) => {
    switch (paymentMethod) {
      case 1:
        return "Cash";

      case 2:
        return "Card";

      default:
        return "Unknown";
    }
  };

  const getOrderStatusName = (status: number) => {
    switch (status) {
      case 1:
        return "Completed";

      case 2:
        return "In Progress";

      case 3:
        return "Cancelled";

      default:
        return `Status ${status}`;
    }
  };

  /* =========================================================
     Payment List Search
     ========================================================= */

  const filteredPayments = useMemo(() => {
    const search = paymentSearch.trim().toLowerCase();

    if (!search) {
      return payments;
    }

    return payments.filter((payment) => {
      const itemNames = payment.orderItems
        ?.map((item) => item.menuId)
        .join(" ")
        .toLowerCase();

      return (
        payment.orderNumber?.toLowerCase().includes(search) ||
        payment.customerName?.toLowerCase().includes(search) ||
        payment.customerPhone?.toLowerCase().includes(search) ||
        itemNames?.includes(search) ||
        String(payment.discountedTotalAmount).includes(search)
      );
    });
  }, [paymentSearch, payments]);

  /* =========================================================
     Pagination
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / itemsPerPage),
  );

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;

    return filteredPayments.slice(start, start + itemsPerPage);
  }, [currentPage, filteredPayments, itemsPerPage]);

  const showingFrom =
    filteredPayments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const showingTo = Math.min(
    currentPage * itemsPerPage,
    filteredPayments.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =========================================================
     Payment Summary
     ========================================================= */

  const totalRevenue = useMemo(() => {
    return payments.reduce(
      (total, payment) => total + Number(payment.discountedTotalAmount || 0),
      0,
    );
  }, [payments]);

  const cashRevenue = useMemo(() => {
    return payments
      .filter((payment) => payment.paymentMethod === 1)
      .reduce(
        (total, payment) => total + Number(payment.discountedTotalAmount || 0),
        0,
      );
  }, [payments]);

  const cardRevenue = useMemo(() => {
    return payments
      .filter((payment) => payment.paymentMethod === 2)
      .reduce(
        (total, payment) => total + Number(payment.discountedTotalAmount || 0),
        0,
      );
  }, [payments]);

  const selectedFoods = useMemo(() => {
    return foods.filter((item) => selectedIds.includes(item.id));
  }, [foods, selectedIds]);

  /* =========================================================
     Selected Items
     ========================================================= */

  const selectedItems: SelectedItem[] = useMemo(() => {
    return selectedFoods;
  }, [selectedFoods]);

  /* =========================================================
     Form Totals
     ========================================================= */

  const serviceTotal = useMemo(() => {
    return selectedFoods.reduce(
      (total, currentService) => total + currentService.price,
      0,
    );
  }, [selectedFoods]);

  const subTotal = serviceTotal;

  const discount = Math.max(Number(form.discount) || 0, 0);

  const discountedTotal = Math.max(subTotal - discount, 0);

  /* =========================================================
     Service Search
     ========================================================= */

  const filteredFoods = useMemo(() => {
    const search = selectorSearch.trim().toLowerCase();

    if (!search) {
      return foods;
    }

    return foods.filter((item) => {
      return item.name.toLowerCase().includes(search);
    });
  }, [foods, selectorSearch]);

  const toggleService = (id: string) => {
    setselectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  const removeSelectedItem = (item: SelectedItem) => {
    setselectedIds((previous) => previous.filter((id) => id !== item.id));
  };

  const clearSelection = () => {
    setselectedIds([]);
  };

  /* =========================================================
     Form Change
     ========================================================= */

  const handleChange = (field: keyof PaymentForm, value: string | number) => {
    setForm((previous) => ({
      ...previous,
      [field]: value as PaymentForm[typeof field],
    }));
  };

  /* =========================================================
     Reset Form
     ========================================================= */

  const resetPaymentForm = () => {
    setForm(initialForm);

    setselectedIds([]);

    setSelectorSearch("");
    setIsSelectorOpen(false);
  };

  /* =========================================================
     Handle Pay
     ========================================================= */

  const handlePay = async (paymentData: CafePaymentPayload) => {
    try {
      setIsSubmitting(true);

      const response = await pay(paymentData);

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Payment successful",
        description: "The cafe payment was added successfully.",
      });

      resetPaymentForm();

      await getAllPayments();

      setPageView("list");

      return response;
    } catch (error) {
      console.error("Error creating payment:", error);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Payment failed",
        description: "Unable to create the payment. Please try again.",
      });

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     Submit Payment
     ========================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mobileNumber = form.customerPhone.trim();

    if (mobileNumber && !/^07\d{8}$/.test(mobileNumber)) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Invalid mobile number",
        description:
          "Please enter a valid 10-digit mobile number starting with 07.",
      });

      return;
    }

    if (selectedIds.length === 0) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Select an item",
        description: "Please select at least one food or drink.",
      });

      return;
    }

    if (subTotal <= 0) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Invalid subtotal",
        description: "The order subtotal must be greater than zero.",
      });

      return;
    }

    if (discount > subTotal) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Invalid discount",
        description: "Discount cannot be greater than the subtotal.",
      });

      return;
    }

    const body = {
      CustomerName: form.customerName.trim(),
      CustomerPhone: form.customerPhone.trim(),
      totalMinutesSpent: 0,
      isPaid: true,
      paymentMethod: form.paymentMethod,
      orderType: form.orderType,
      remark: "",
      address: form.address.trim(),
      deliveryInstructions: form.deliveryInstructions.trim(),
      deliveryTime: "",
      deliveryPerson: "",
      deliveryPersonPhone: "",
      tableNumber: form.tableNumber.trim(),
      orderItems: selectedIds.map((id) => ({
        menuId: id,
        quantity: 1,
        price: foods.find((item) => item.id === id)?.price || 0,
        discount,
      })),
    };

    setPendingPayment(body);
  };

  /* =========================================================
     Main UI
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-50/60">
      {/* Alert */}

      {pageAlert.visible &&
        createPortal(
          <div className="fixed right-4 top-4 z-[99999] w-[calc(100%-2rem)] max-w-md">
            <CustomAlert
              alert={pageAlert}
              onClose={() =>
                setPageAlert((previous) => ({
                  ...previous,
                  visible: false,
                }))
              }
            />
          </div>,
          document.body,
        )}

      {/* Loading */}

      {(isPaymentsLoading || isFoodsLoading || isSubmitting) &&
        createPortal(
          <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />

              <p className="text-sm font-medium text-white">
                {isSubmitting
                  ? "Processing payment..."
                  : pageView === "add"
                    ? "Loading foods..."
                    : "Loading payments..."}
              </p>
            </div>
          </div>,
          document.body,
        )}

      {/* Payment Details */}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          formatPrice={formatPrice}
          formatDate={formatDate}
          getPaymentMethodName={getPaymentMethodName}
          getOrderStatusName={getOrderStatusName}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {pendingPayment && (
        <PaymentConfirmationModal
          payment={pendingPayment}
          items={selectedItems}
          total={discountedTotal}
          formatPrice={formatPrice}
          onCancel={() => setPendingPayment(null)}
          onConfirm={async () => {
            setPendingPayment(null);
            await handlePay(pendingPayment);
          }}
        />
      )}

      {/* =====================================================
          LIST VIEW
          ===================================================== */}

      {pageView === "list" && (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7A3E18] text-white shadow-sm shadow-amber-900/20">
                <ReceiptText size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Cafe Payments
                </h1>

                <p className="text-sm text-slate-500">
                  View and manage cafe orders and payments.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-900 hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleOpenAddPayment}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A3E18] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A2E12]"
              >
                <Plus size={17} />
                Add Payment
              </button>
            </div>
          </div>

          {/* Summary */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Payments"
              value={String(payments.length)}
              icon={<ReceiptText size={20} />}
              iconClassName="bg-amber-50 text-amber-900"
            />

            <SummaryCard
              title="Total Revenue"
              value={formatPrice(totalRevenue)}
              icon={<Banknote size={20} />}
              iconClassName="bg-amber-50 text-amber-600"
            />

            <SummaryCard
              title="Cash Revenue"
              value={formatPrice(cashRevenue)}
              icon={<Banknote size={20} />}
              iconClassName="bg-amber-50 text-amber-600"
            />

            <SummaryCard
              title="Card Revenue"
              value={formatPrice(cardRevenue)}
              icon={<CreditCard size={20} />}
              iconClassName="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Table Card */}

          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Search */}

            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(event) => {
                    setPaymentSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search order, customer, phone or food..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                />
              </div>

              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">
                  {filteredPayments.length}
                </span>{" "}
                payments
              </p>
            </div>

            {/* Desktop Table */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <TableHeading>Order</TableHeading>

                    <TableHeading>Date</TableHeading>

                    <TableHeading>Customer</TableHeading>

                    <TableHeading>Order Type</TableHeading>

                    <TableHeading>Payment</TableHeading>

                    <TableHeading>Amount</TableHeading>

                    <th className="w-20 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment) => {
                      return (
                        <tr
                          key={
                            payment.cafeOrderId ??
                            payment.id ??
                            payment.orderNumber
                          }
                          className="transition hover:bg-slate-50/80"
                        >
                          {/* Order */}

                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {payment.orderNumber || "-"}
                              </p>
                            </div>
                          </td>

                          {/* Date */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(payment.orderDate)}
                          </td>

                          {/* Customer */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {payment.customerName || "N/A"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {payment.customerPhone || "-"}
                            </p>
                          </td>

                          {/* Order type */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {getOrderTypeName(payment.orderType)}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {payment.orderItems?.length ?? 0} items
                            </p>
                          </td>

                          {/* Method */}

                          <td className="px-5 py-4">
                            <PaymentMethodBadge
                              paymentMethod={payment.paymentMethod}
                            />
                          </td>

                          {/* Amount */}

                          <td className="px-5 py-4">
                            <p className="font-bold text-emerald-700">
                              {formatPrice(payment.discountedTotalAmount)}
                            </p>

                            {payment.discount > 0 && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                Discount {formatPrice(payment.discount)}
                              </p>
                            )}
                          </td>

                          {/* Action */}

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedPayment(payment)}
                              title="View payment details"
                              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-amber-900 hover:bg-amber-100 hover:text-amber-700"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <PaymentsEmptyState />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => {
                  const totalItems = payment.orderItems?.length ?? 0;

                  return (
                    <article
                      key={
                        payment.cafeOrderId ?? payment.id ?? payment.orderNumber
                      }
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {payment.orderNumber || "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(payment.orderDate)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-amber-900"
                        >
                          <Eye size={17} />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MobileInfo
                          label="Customer"
                          value={payment.customerName || "N/A"}
                        />

                        <MobileInfo
                          label="Order type"
                          value={getOrderTypeName(payment.orderType)}
                        />

                        <MobileInfo label="Items" value={`${totalItems}`} />

                        <MobileInfo
                          label="Payment"
                          value={getPaymentMethodName(payment.paymentMethod)}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <OrderStatusBadge
                          status={payment.orderStatus ?? 1}
                          isPaid={payment.isPaid}
                        />

                        <p className="text-lg font-bold text-emerald-700">
                          {formatPrice(payment.discountedTotalAmount)}
                        </p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <PaymentsEmptyState />
              )}
            </div>

            {/* Pagination */}

            {!isPaymentsLoading && filteredPayments.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {showingFrom}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-700">
                      {showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredPayments.length}
                    </span>{" "}
                    payments
                  </p>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="payment-rows"
                      className="text-xs font-medium text-slate-500"
                    >
                      Rows:
                    </label>

                    <select
                      id="payment-rows"
                      value={itemsPerPage}
                      onChange={(event) => {
                        setItemsPerPage(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((previous) => Math.max(previous - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-amber-900 hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm font-semibold text-slate-600">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.min(previous + 1, totalPages),
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-amber-900 hover:bg-amber-100 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =====================================================
          ADD PAYMENT VIEW
          ===================================================== */}

      {pageView === "add" && (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-900 text-white shadow-sm shadow-amber-900/20">
                <Banknote size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Add Cafe Payment
                </h1>

                <p className="text-sm text-slate-500">
                  Create a customer order and process payment.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBackToPayments}
              disabled={isSubmitting}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-900 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-50"
            >
              <ArrowLeft size={17} />
              Back to Payments
            </button>
          </div>

          {/* Summary */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Selected Items"
              value={String(selectedItems.length)}
              icon={<ShoppingCart size={20} />}
              iconClassName="bg-amber-50 text-amber-900"
            />

            <SummaryCard
              title="Subtotal"
              value={formatPrice(subTotal)}
              icon={<Banknote size={20} />}
              iconClassName="bg-amber-50 text-amber-900"
            />

            <SummaryCard
              title="Final Amount"
              value={formatPrice(discountedTotal)}
              icon={<Sparkles size={20} />}
              iconClassName="bg-amber-50 text-amber-900"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
              {/* LEFT */}

              <div className="space-y-6">
                {/* Foods and drinks */}

                <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <SectionHeader
                    icon={<Coffee size={19} />}
                    title="Foods & Drinks"
                    description="Select one or multiple foods and drinks for the customer order."
                  />

                  <div className="p-5">
                    <div className="relative" ref={selectorRef}>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Select Items
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setIsSelectorOpen((previous) => !previous)
                        }
                        className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left transition ${
                          isSelectorOpen
                            ? "border-amber-500 ring-4 ring-amber-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={
                            selectedItems.length > 0
                              ? "text-sm font-medium text-slate-800"
                              : "text-sm text-slate-400"
                          }
                        >
                          {selectedItems.length > 0
                            ? `${selectedItems.length} item${
                                selectedItems.length > 1 ? "s" : ""
                              } selected`
                            : "Select foods or drinks"}
                        </span>

                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-400 transition ${
                            isSelectorOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Selector */}

                      {isSelectorOpen && (
                        <div className="absolute left-0 right-0 top-[76px] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                          <div className="border-b border-slate-200 p-3">
                            <div className="relative">
                              <Search
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                              />

                              <input
                                type="text"
                                value={selectorSearch}
                                onChange={(event) =>
                                  setSelectorSearch(event.target.value)
                                }
                                placeholder="Search foods or drinks..."
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                              />
                            </div>
                          </div>

                          <div className="max-h-[430px] overflow-y-auto">
                            <div>
                              <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-50 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Coffee
                                    size={15}
                                    className="text-amber-900"
                                  />

                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Foods & Drinks
                                  </span>
                                </div>

                                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                  {filteredFoods.length}
                                </span>
                              </div>

                              {filteredFoods.length > 0 ? (
                                filteredFoods.map((item) => {
                                  const selected = selectedIds.includes(
                                    item.id,
                                  );

                                  return (
                                    <SelectorItem
                                      key={item.id}
                                      title={item.name}
                                      price={formatPrice(item.price)}
                                      selected={selected}
                                      onClick={() => toggleService(item.id)}
                                    />
                                  );
                                })
                              ) : (
                                <DropdownEmpty text="No foods found." />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Items */}

                    {selectedItems.length > 0 ? (
                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700">
                            Selected Items
                          </p>

                          <button
                            type="button"
                            onClick={clearSelection}
                            className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Clear all
                          </button>
                        </div>

                        <div className="space-y-2">
                          {selectedItems.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${"bg-amber-100 text-amber-900"}`}
                                  >
                                    <Coffee size={17} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {item.name}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Food or drink
                                    </p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <span className="text-sm font-bold text-emerald-600">
                                    {formatPrice(item.price)}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => removeSelectedItem(item)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-200 text-amber-500">
                          <ShoppingCart size={20} />
                        </div>

                        <p className="text-sm font-semibold text-amber-700">
                          No items selected
                        </p>

                        <p className="mt-1 text-xs text-amber-500">
                          Select foods from the dropdown.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Customer */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <SectionHeader
                    icon={<User size={19} />}
                    title="Customer Details"
                    description="Add customer and order information."
                  />

                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <InputField
                      label="Customer Name"
                      value={form.customerName}
                      placeholder="Enter customer name"
                      onChange={(value) => handleChange("customerName", value)}
                    />

                    <InputField
                      label="Customer Phone"
                      value={form.customerPhone}
                      placeholder="0XXXXXXXXX"
                      onChange={(value) => {
                        const numericValue = value.replace(/\D/g, "");

                        if (numericValue.length <= 10) {
                          handleChange("customerPhone", numericValue);
                        }
                      }}
                    />

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Order Type
                      </label>

                      <select
                        value={form.orderType}
                        onChange={(event) =>
                          handleChange("orderType", Number(event.target.value))
                        }
                        className="h-11 cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                      >
                        <option value="">Select order type</option>

                        {OrderTypes.map((order) => (
                          <option key={order.value} value={order.value}>
                            {order.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT */}

              <div>
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
                  <SectionHeader
                    icon={<CreditCard size={19} />}
                    title="Payment"
                    description="Review order totals and payment method."
                  />

                  <div className="p-5">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Payment Method
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <PaymentMethodCard
                        title="Cash"
                        description="Cash payment"
                        icon={<Banknote size={20} />}
                        selected={form.paymentMethod === 1}
                        onClick={() => handleChange("paymentMethod", 1)}
                      />

                      <PaymentMethodCard
                        title="Card"
                        description="Card payment"
                        icon={<CreditCard size={20} />}
                        selected={form.paymentMethod === 2}
                        onClick={() => handleChange("paymentMethod", 2)}
                      />
                    </div>

                    <div className="space-y-3">
                      <PriceRow
                        title="Subtotal"
                        value={formatPrice(subTotal)}
                        strong
                      />
                    </div>

                    {/* Discount */}

                    <div className="mt-5">
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Discount
                      </label>

                      <div className="relative">
                        <BadgePercent
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="number"
                          value={form.discount}
                          min={0}
                          max={subTotal}
                          onChange={(event) =>
                            handleChange("discount", event.target.value)
                          }
                          placeholder="0"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-14 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                        />

                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          LKR
                        </span>
                      </div>
                    </div>

                    {/* Total */}

                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-800">
                          Total Payable
                        </span>

                        <Sparkles size={18} className="text-emerald-600" />
                      </div>

                      <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                        {formatPrice(discountedTotal)}
                      </p>

                      {discount > 0 && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          Additional discount: {formatPrice(discount)}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isFoodsLoading ||
                        selectedItems.length === 0
                      }
                      className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Add Payment
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function PaymentConfirmationModal({
  payment,
  items,
  total,
  formatPrice,
  onCancel,
  onConfirm,
}: {
  payment: CafePaymentPayload;
  items: SelectedItem[];
  total: number;
  formatPrice: (price: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-900 text-white">
              <ReceiptText size={21} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Confirm Payment
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Review this cafe order before submitting it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Cancel payment confirmation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <DetailCard label="Order Type" value={getOrderTypeName(payment.orderType)} />
            <DetailCard
              label="Payment Method"
              value={payment.paymentMethod === 1 ? "Cash" : "Card"}
            />
          </div>

          {(payment.CustomerName || payment.CustomerPhone) && (
            <DetailCard
              label="Customer"
              value={[payment.CustomerName, payment.CustomerPhone]
                .filter(Boolean)
                .join(" - ")}
            />
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Order Items
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <span className="min-w-0 truncate pr-3 text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="font-bold text-slate-900">Total Payable</span>
            <span className="text-xl font-bold text-emerald-700">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            <Check size={17} />
            Confirm Payment
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* =========================================================
   Payment Details Modal
   ========================================================= */

function PaymentDetailsModal({
  payment,
  formatPrice,
  formatDate,
  getPaymentMethodName,
  getOrderStatusName,
  onClose,
}: {
  payment: PaymentRecord;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  getPaymentMethodName: (method: number) => string;
  getOrderStatusName: (status: number) => string;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-900 text-white">
              <ReceiptText size={21} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Payment Details
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                {payment.orderNumber || "Cafe order"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            <DetailCard
              label="Order Date"
              value={formatDate(payment.orderDate)}
            />

            <DetailCard
              label="Payment Method"
              value={getPaymentMethodName(payment.paymentMethod)}
            />

            <DetailCard
              label="Customer"
              value={payment.customerName || "N/A"}
            />

            <DetailCard label="Phone" value={payment.customerPhone || "-"} />

            <DetailCard
              label="Order Type"
              value={getOrderTypeName(payment.orderType)}
            />

            <DetailCard
              label="Order Status"
              value={getOrderStatusName(payment.orderStatus ?? 1)}
            />
          </div>

          {/* Food items */}

          <div className="mt-6">
            <h3 className="font-bold text-slate-900">Foods</h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Foods added to this payment.
            </p>

            <div className="mt-3 space-y-2">
              {payment.orderItems?.length ? (
                payment.orderItems.map((item) => (
                  <OrderItem
                    key={item.menuId}
                    icon={<Coffee size={17} />}
                    name={item.menuName || item.menuId}
                    price={formatPrice(
                      item.price * item.quantity - item.discount,
                    )}
                  />
                ))
              ) : (
                <SmallEmpty text="No foods added." />
              )}
            </div>
          </div>

          {/* Pricing */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-3">
              <PriceRow
                title="Subtotal"
                value={formatPrice(payment.subTotalAmount)}
              />

              <PriceRow
                title="Discount"
                value={`- ${formatPrice(payment.discount)}`}
              />

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Total Paid</span>

                  <span className="text-xl font-bold text-emerald-700">
                    {formatPrice(payment.discountedTotalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-amber-900 px-5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
/* =========================================================
   Small Components
   ========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-900">
        {icon}
      </div>

      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        <span className="ml-1 text-xs font-normal text-slate-400">
          (Optional)
        </span>
      </label>

      <input
        type={type}
        value={value}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
      />
    </div>
  );
}

function SelectorItem({
  title,
  price,
  selected,
  onClick,
}: {
  title: string;
  price: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-left ${
        selected ? "bg-amber-50/70" : "hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          selected
            ? "border-amber-900 bg-amber-900 text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {selected && <Check size={13} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      </div>

      <p className="shrink-0 text-sm font-bold text-emerald-600">{price}</p>
    </button>
  );
}

function PaymentMethodCard({
  title,
  description,
  icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border p-3 text-left ${
        selected
          ? "border-amber-900 bg-amber-50 ring-1 ring-amber-900"
          : "border-slate-200 bg-white hover:border-amber-300"
      }`}
    >
      {selected && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-900 text-white">
          <Check size={12} />
        </div>
      )}

      <div
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
          selected ? "bg-amber-900 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-800">{title}</p>

      <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
    </button>
  );
}

function PriceRow({
  title,
  value,
  strong = false,
}: {
  title: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong ? "border-t border-slate-200 pt-3" : ""
      }`}
    >
      <span
        className={
          strong ? "text-sm font-bold text-slate-800" : "text-sm text-slate-500"
        }
      >
        {title}
      </span>

      <span
        className={
          strong
            ? "text-sm font-bold text-slate-900"
            : "text-sm font-semibold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-0.5 truncate text-xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function TableHeading({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function PaymentMethodBadge({ paymentMethod }: { paymentMethod: number }) {
  if (paymentMethod === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
        <CreditCard size={13} />
        Card
      </span>
    );
  }

  if (paymentMethod === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Banknote size={13} />
        Cash
      </span>
    );
  }

  return (
    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
      Unknown
    </span>
  );
}

function OrderStatusBadge({
  status,
  isPaid,
}: {
  status: number;
  isPaid: boolean;
}) {
  if (!isPaid) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Unpaid
      </span>
    );
  }

  if (status === 3) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  if (status === 2) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      <Check size={11} />
      Paid
    </span>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function OrderItem({
  icon,
  name,
  price,
}: {
  icon: ReactNode;
  name: string;
  price: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-900">
          {icon}
        </div>

        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
      </div>

      <span className="shrink-0 text-sm font-bold text-emerald-700">
        {price}
      </span>
    </div>
  );
}

function DropdownEmpty({ text }: { text: string }) {
  return (
    <div className="px-4 py-6 text-center text-xs text-slate-400">{text}</div>
  );
}

function SmallEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function PaymentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ReceiptText size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">No payments found</h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No payments match the current search or no cafe payments have been
        created yet.
      </p>
    </div>
  );
}

function CustomAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${styles[alert.variant]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{alert.title}</p>

        <p className="mt-1 text-sm opacity-80">{alert.description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5"
      >
        <X size={17} />
      </button>
    </div>
  );
}
