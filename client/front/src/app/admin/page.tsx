"use client";
import React, { useState } from "react";
import TagManagement from "./tags/TagManagement";
import styles from "./AdminPanel.module.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tags");

  const renderTabContent = () => {
    switch (activeTab) {
      case "tags":
        return <TagManagement />;
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
        {/* Другие вкладки можно добавить здесь */}
      </div>
      <div className={styles.tabContent}>{renderTabContent()}</div>
    </div>
  );
};

export default AdminPanel;