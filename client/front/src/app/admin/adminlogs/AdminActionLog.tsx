"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import styles from "./AdminActionLog.module.css";

interface AdminActionLog {
  id: string;
  adminId: string;
  adminName: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  details: string | object;
  createdAt: string;
}

interface LogResponse {
  logs: AdminActionLog[];
  totalCount: number;
}

const AdminActionLog: React.FC = () => {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, entityType, startDate, endDate, page]);

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(actionType && { actionType }),
        ...(entityType && { entityType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await authService.axiosWithRefresh<LogResponse>(
        "get",
        `/admin/action-logs?${queryParams.toString()}`
      );
      if (response){
        response.logs.forEach((log) => {
            if (log.details && typeof log.details === "string") {
                try {
                    log.details = JSON.parse(log.details);
                } catch {
                    log.details = log.details;
                }
            }
        });
      }
      setLogs(response?.logs || []);
      setTotalPages(Math.ceil((response?.totalCount || 0) / pageSize));
    } catch (error) {
      toast.error("Ошибка загрузки логов");
      console.error(error);
    }
  };

  const toggleDetails = (logId: string) => {
    setExpandedDetails(expandedDetails === logId ? null : logId);
  };

  const renderDetails = (details: string | object) => {
    if (typeof details === "string") {
      return details; // Показываем строку как есть
    }
    return <pre>{JSON.stringify(details, null, 2)}</pre>; // Форматируем объект как JSON
  };

  const renderShortDetails = (details: string | object) => {
    if (typeof details === "string") {
      return details; // Для строк показываем как есть
    }
    return JSON.stringify(details); // Для объектов показываем без форматирования
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Логи действий администратора</h2>
      <div className={styles.form}>
        <input
          type="text"
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          placeholder="Тип действия (например, UpdateUser)"
          className={styles.input}
        />
        <input
          type="text"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          placeholder="Тип объекта (например, User)"
          className={styles.input}
        />
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
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Администратор</th>
            <th className={styles.th}>Тип действия</th>
            <th className={styles.th}>Тип объекта</th>
            <th className={styles.th}>ID объекта</th>
            <th className={styles.th}>Детали</th>
            <th className={styles.th}>Дата</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <React.Fragment key={log.id}> 
                <tr key={log.id} className={styles.tr} onClick={() => toggleDetails(log.id)}>
                    <td className={styles.td}>{log.adminName}</td>
                    <td className={styles.td}>{log.actionType}</td>
                    <td className={styles.td}>{log.entityType}</td>
                    <td className={styles.td}>{log.entityId || "—"}</td>
                    <td className={`${styles.td} ${styles.details}`}>
                        {renderShortDetails(log.details)}
                    </td>
                    <td className={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
                {expandedDetails === log.id && (
                    <tr className={styles.detailsRow}>
                        <td colSpan={6} className={styles.detailsContent}>
                            {renderDetails(log.details)}
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

export default AdminActionLog;