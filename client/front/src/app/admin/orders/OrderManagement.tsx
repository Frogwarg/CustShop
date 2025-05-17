"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import useDebounce from "../../utils/useDebounce";
import styles from "./OrderManagement.module.css";
import Image from "next/image";

interface OrderItem {
  designId: string;
  designName: string;
  quantity: number;
  unitPrice: number;
  previewUrl: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  orderComment: string;
  adminComment: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
  address: Address;
  orderItems: OrderItem[];
}

interface OrderResponse {
  orders: Order[];
  totalCount: number;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 500);
  const debouncedCustomerName = useDebounce(customerName, 500);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, paymentStatus, startDate, endDate, debouncedCustomerName, page]);

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(debouncedCustomerName && { customerName: debouncedCustomerName }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await authService.axiosWithRefresh<OrderResponse>(
        "get",
        `/admin/orders?${queryParams.toString()}`
      );
      setOrders(response?.orders || []);
      const totalCount = Math.ceil((response?.totalCount || 0) / pageSize);
      setTotalPages(totalCount != 0 ? totalCount : 1);
    } catch (error) {
      toast.error("Ошибка загрузки заказов");
      console.error(error);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление заказами</h2>
      <div className={styles.form}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по сумме"
          className={styles.input}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={styles.input}
        >
          <option value="">Все статусы заказа</option>
          <option value="Pending">В ожидании</option>
          <option value="Confirmed">Подтверждён</option>
          <option value="Shipped">Отправлен</option>
          <option value="Delivered">Доставлен</option>
          <option value="Cancelled">Отменён</option>
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className={styles.input}
        >
          <option value="">Все статусы оплаты</option>
          <option value="Pending">Ожидает оплаты</option>
          <option value="Paid">Оплачен</option>
          <option value="Failed">Не оплачен</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Дата начала"
          className={styles.input}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="Дата окончания"
          className={styles.input}
        />
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="ФИО заказчика"
          className={styles.input}
        />
      </div>
      {editOrder && (
        <div className={styles.form}>
            <select
                value={editOrder.status}
                onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                className={styles.input}
            >
                <option value="Pending">В ожидании</option>
                <option value="Confirmed">Подтверждён</option>
                <option value="Shipped">Отправлен</option>
                <option value="Delivered">Доставлен</option>
                <option value="Cancelled">Отменён</option>
            </select>
            <select
                value={editOrder.paymentStatus}
                onChange={(e) => setEditOrder({ ...editOrder, paymentStatus: e.target.value })}
                className={styles.input}
            >
                <option value="Pending">Ожидает оплаты</option>
                <option value="Paid">Оплачен</option>
                <option value="Failed">Не оплачен</option>
            </select>
            <textarea
                value={editOrder.adminComment || ""}
                onChange={(e) => setEditOrder({ ...editOrder, adminComment: e.target.value })}
                placeholder="Комментарий администратора"
                className={styles.input}
            />
            <button
                onClick={async () => {
                    try {
                    await authService.axiosWithRefresh("put", `/admin/orders/${editOrder.id}/status`, {
                        status: editOrder.status,
                        paymentStatus: editOrder.paymentStatus,
                        adminComment: editOrder.adminComment || "",
                    });
                    setEditOrder(null);
                    fetchOrders();
                    toast.success("Статус заказа обновлён");
                    } catch (error) {
                    toast.error("Ошибка обновления статуса заказа");
                    console.error(error);
                    }
                }}
                className={styles.saveButton}
            >
                Сохранить
            </button>
            <button
                onClick={() => setEditOrder(null)}
                className={styles.cancelButton}
            >
                Отмена
            </button>
        </div>
        )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Номер заказа</th>
            <th className={styles.th}>Общая сумма</th>
            <th className={styles.th}>Статус заказа</th>
            <th className={styles.th}>Статус оплаты</th>
            <th className={styles.th}>Способ доставки</th>
            <th className={styles.th}>Дата создания</th>
            <th className={styles.th}>Комментарий</th>
            <th className={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <React.Fragment key={order.id}>
              <tr
                className={styles.tr}
                onClick={() => toggleOrderDetails(order.id)}
              >
                <td className={styles.td}>{order.id}</td>
                <td className={styles.td}>{order.totalAmount} ₽</td>
                <td className={styles.td}>{order.status}</td>
                <td className={styles.td}>{order.paymentStatus}</td>
                <td className={styles.td}>{order.deliveryMethod}</td>
                <td className={styles.td}>
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className={styles.td}>
                  {order.orderComment || order.adminComment || "—"}
                </td>
                <td className={styles.td}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditOrder(order);
                        }}
                        className={styles.editButton}
                    >
                        Редактировать
                    </button>
                </td>
              </tr>
              {expandedOrder === order.id && (
                <tr>
                  <td colSpan={8} className={styles.detailsContent}>
                    <div className={styles.orderDetails}>
                      <div className={styles.orderItems}>
                        <h3 className={styles.subTitle}>Товары в заказе</h3>
                        {order.orderItems.length === 0 ? (
                          <p>Товары отсутствуют</p>
                        ) : (
                          <ul className={styles.itemList}>
                            {order.orderItems.map((item, index) => (
                              <li key={index} className={styles.orderItem}>
                                <Image
                                  src={item.previewUrl}
                                  alt={item.designName}
                                  width={80}
                                  height={80}
                                  className={styles.orderItemImage}
                                />
                                <div>
                                  <p>
                                    <strong>Дизайн:</strong> {item.designName}
                                  </p>
                                  <p>
                                    <strong>Количество:</strong> {item.quantity}{" "}
                                    шт.
                                  </p>
                                  <p>
                                    <strong>Цена за единицу:</strong>{" "}
                                    {item.unitPrice} ₽
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className={styles.customerInfo}>
                        <h3 className={styles.subTitle}>Данные заказчика</h3>
                        <table className={styles.infoTable}>
                          <tbody>
                            <tr>
                              <td className={styles.infoLabel}>ФИО:</td>
                              <td className={styles.infoValue}>
                                {order.firstName} {order.lastName}{" "}
                                {order.middleName || ""}
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.infoLabel}>Email:</td>
                              <td className={styles.infoValue}>
                                {order.email}
                              </td>
                            </tr>
                            <tr>
                              <td className={styles.infoLabel}>Телефон:</td>
                              <td className={styles.infoValue}>
                                {order.phoneNumber}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {order.deliveryMethod === "Delivery" && (
                          <>
                            <h3 className={styles.subTitle}>Адрес доставки</h3>
                            <table className={styles.infoTable}>
                              <tbody>
                                <tr>
                                  <td className={styles.infoLabel}>Улица:</td>
                                  <td className={styles.infoValue}>
                                    {order.address.street}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Город:</td>
                                  <td className={styles.infoValue}>
                                    {order.address.city}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Регион:</td>
                                  <td className={styles.infoValue}>
                                    {order.address.state}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>
                                    Почтовый индекс:
                                  </td>
                                  <td className={styles.infoValue}>
                                    {order.address.postalCode}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Страна:</td>
                                  <td className={styles.infoValue}>
                                    {order.address.country}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className={styles.paginationButton}
        >
          Предыдущая
        </button>
        <span>Страница {page} из {totalPages}</span>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className={styles.paginationButton}
        >
          Следующая
        </button>
      </div>
    </div>
  );
};

export default OrderManagement;