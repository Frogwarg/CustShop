'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import authService from '../services/authService';
import styles from './styles.module.css';

interface OrderItem {
  designId: string;
  designName: string;
  previewUrl: string;
  quantity: number;
  unitPrice: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Discount {
  code: string;
  amount: number;
  discountType: string;
}

interface Order {
  id: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  orderComment: string;
  address: Address;
  discount?: Discount;
  orderItems: OrderItem[];
  createdAt: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
}

interface OrderFormData {
  [key: string]: {
    status: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const OrderModeration: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderFormData, setOrderFormData] = useState<OrderFormData>({});
  const [editingOrderField, setEditingOrderField] = useState<{
    orderId: string;
    field: "street" | "city" | "state" | "postalCode" | "country" | null;
  }>({ orderId: "", field: null });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersResponse = await authService.axiosWithRefresh<Order[]>(
          "get",
          "/order/paid"
        );
        setOrders(ordersResponse);
        setOrderFormData(
          ordersResponse.reduce(
            (acc: OrderFormData, o) => ({
              ...acc,
              [o.id]: {
                status: o.status,
                street: o.address.street,
                city: o.address.city,
                state: o.address.state,
                postalCode: o.address.postalCode,
                country: o.address.country,
              },
            }),
            {}
          )
        );
      } catch (error) {
        console.error("Ошибка:", error);
        toast.error("Ошибка загрузки заказов");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleOrderUpdate = async (orderId: string) => {
    const data = {
      status: orderFormData[orderId].status,
      address: {
        street: orderFormData[orderId].street,
        city: orderFormData[orderId].city,
        state: orderFormData[orderId].state,
        postalCode: orderFormData[orderId].postalCode,
        country: orderFormData[orderId].country,
      },
    };
    try {
      await authService.axiosWithRefresh("put", `/order/${orderId}/status`, data);
      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: data.status, address: data.address } : o
        )
      );
      toast.success("Статус заказа обновлён");
    } catch (error) {
      console.error("Ошибка:", error);
      toast.error("Ошибка при обновлении заказа");
    }
  };

  const startEditingOrder = (
    orderId: string,
    field: "street" | "city" | "state" | "postalCode" | "country"
  ) => {
    setEditingOrderField({ orderId, field });
  };

  const stopEditingOrder = () => {
    setEditingOrderField({ orderId: "", field: null });
  };

  const handleOrderFieldChange = (
    orderId: string,
    field: "street" | "city" | "state" | "postalCode" | "country" | "status",
    value: string
  ) => {
    setOrderFormData({
      ...orderFormData,
      [orderId]: { ...orderFormData[orderId], [field]: value },
    });
  };

  const handleOrderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      stopEditingOrder();
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Номер заказа</th>
            <th className={styles.th}>Общая сумма</th>
            <th className={styles.th}>Статус заказа</th>
            <th className={styles.th}>Способ доставки</th>
            <th className={styles.th}>Дата создания</th>
            <th className={styles.th}>Комментарий</th>
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
                <td className={styles.td}>{order.deliveryMethod}</td>
                <td className={styles.td}>
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className={styles.td}>{order.orderComment || "—"}</td>
              </tr>
              {expandedOrder === order.id && (
                <tr>
                  <td colSpan={6} className={styles.detailsContent}>
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
                                    {editingOrderField.orderId === order.id &&
                                    editingOrderField.field === "street" ? (
                                      <input
                                        type="text"
                                        value={orderFormData[order.id].street}
                                        onChange={(e) =>
                                          handleOrderFieldChange(
                                            order.id,
                                            "street",
                                            e.target.value
                                          )
                                        }
                                        onBlur={stopEditingOrder}
                                        onKeyDown={handleOrderKeyDown}
                                        className={styles.editInput}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          startEditingOrder(order.id, "street")
                                        }
                                        className={styles.editable}
                                      >
                                        {orderFormData[order.id]?.street}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Город:</td>
                                  <td className={styles.infoValue}>
                                    {editingOrderField.orderId === order.id &&
                                    editingOrderField.field === "city" ? (
                                      <input
                                        type="text"
                                        value={orderFormData[order.id].city}
                                        onChange={(e) =>
                                          handleOrderFieldChange(
                                            order.id,
                                            "city",
                                            e.target.value
                                          )
                                        }
                                        onBlur={stopEditingOrder}
                                        onKeyDown={handleOrderKeyDown}
                                        className={styles.editInput}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          startEditingOrder(order.id, "city")
                                        }
                                        className={styles.editable}
                                      >
                                        {orderFormData[order.id]?.city}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Регион:</td>
                                  <td className={styles.infoValue}>
                                    {editingOrderField.orderId === order.id &&
                                    editingOrderField.field === "state" ? (
                                      <input
                                        type="text"
                                        value={orderFormData[order.id].state}
                                        onChange={(e) =>
                                          handleOrderFieldChange(
                                            order.id,
                                            "state",
                                            e.target.value
                                          )
                                        }
                                        onBlur={stopEditingOrder}
                                        onKeyDown={handleOrderKeyDown}
                                        className={styles.editInput}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          startEditingOrder(order.id, "state")
                                        }
                                        className={styles.editable}
                                      >
                                        {orderFormData[order.id]?.state}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>
                                    Почтовый индекс:
                                  </td>
                                  <td className={styles.infoValue}>
                                    {editingOrderField.orderId === order.id &&
                                    editingOrderField.field === "postalCode" ? (
                                      <input
                                        type="text"
                                        value={
                                          orderFormData[order.id].postalCode
                                        }
                                        onChange={(e) =>
                                          handleOrderFieldChange(
                                            order.id,
                                            "postalCode",
                                            e.target.value
                                          )
                                        }
                                        onBlur={stopEditingOrder}
                                        onKeyDown={handleOrderKeyDown}
                                        className={styles.editInput}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          startEditingOrder(order.id, "postalCode")
                                        }
                                        className={styles.editable}
                                      >
                                        {orderFormData[order.id]?.postalCode}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className={styles.infoLabel}>Страна:</td>
                                  <td className={styles.infoValue}>
                                    {editingOrderField.orderId === order.id &&
                                    editingOrderField.field === "country" ? (
                                      <input
                                        type="text"
                                        value={orderFormData[order.id].country}
                                        onChange={(e) =>
                                          handleOrderFieldChange(
                                            order.id,
                                            "country",
                                            e.target.value
                                          )
                                        }
                                        onBlur={stopEditingOrder}
                                        onKeyDown={handleOrderKeyDown}
                                        className={styles.editInput}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          startEditingOrder(order.id, "country")
                                        }
                                        className={styles.editable}
                                      >
                                        {orderFormData[order.id]?.country}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={styles.form}>
                      <select
                        value={orderFormData[order.id]?.status || ""}
                        onChange={(e) =>
                          handleOrderFieldChange(
                            order.id,
                            "status",
                            e.target.value
                          )
                        }
                        className={styles.input}
                      >
                        <option value="Pending">В ожидании</option>
                        <option value="Confirmed">Подтверждён</option>
                        <option value="Cancelled">Отменён</option>
                        <option value="Shipped">Отправлен</option>
                        <option value="Delivered">Доставлен</option>
                      </select>
                      <button
                        onClick={() => handleOrderUpdate(order.id)}
                        className={styles.saveButton}
                      >
                        Обновить заказ
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderModeration;