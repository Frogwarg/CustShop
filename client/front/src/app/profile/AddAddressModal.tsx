import React, { useState } from 'react';
import authService from '../services/authService';
import { toast } from 'sonner';
import styles from './Profile.module.css'; // Используем те же стили, что в Checkout

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string;
}

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdded: (address: Address) => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ isOpen, onClose, onAddressAdded }) => {
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    label: '',
  });

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.axiosWithRefresh<Address>('post', '/profile/addresses', JSON.stringify(newAddress));
      onAddressAdded(response);
      setNewAddress({ street: '', city: '', state: '', postalCode: '', country: '', label: '' });
      onClose();
      toast.success('Адрес добавлен!');
    } catch (error) {
      console.error('Ошибка добавления адреса:', error);
      toast.error('Ошибка добавления адреса');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Добавить новый адрес</h3>
        <form onSubmit={handleAddAddress} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Улица:</label>
            <input
              type="text"
              value={newAddress.street}
              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Город:</label>
            <input
              type="text"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Область/регион:</label>
            <input
              type="text"
              value={newAddress.state}
              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Почтовый индекс:</label>
            <input
              type="text"
              value={newAddress.postalCode}
              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Страна:</label>
            <input
              type="text"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Метка (опционально):</label>
            <input
              type="text"
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.modalButtons}>
            <button type="submit" className={`${styles.button} ${styles.green}`}>
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.gray}`}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;