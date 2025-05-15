"use client";
import React, { useState } from "react";
import TagManagement from "./tags/TagManagement";
import UserManagement from "./users/UserManagement";
import AdminActionLog from "./adminlogs/AdminActionLog";
import styles from "./AdminPanel.module.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tags");

  const renderTabContent = () => {
    switch (activeTab) {
      case "tags":
        return <TagManagement />;
      case "users":
        return <UserManagement />;
      case "adminlogs":
        return <AdminActionLog />;
      default:
        return <div>Выберите вкладку</div>;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Панель администратора</h1>
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "tags" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("tags")}
        >
          Теги
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "users" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Пользователи
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "adminlogs" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("adminlogs")}
        >
          Логи действий администратора
        </button>
        {/* Другие вкладки можно добавить здесь */}
      </div>
      <div className={styles.tabContent}>{renderTabContent()}</div>
    </div>
  );
};

export default AdminPanel;