import React from 'react';
import styles from '@/app/styles/dashboard.module.css';

export default function DashboardLoading() {
  return (    <div className={styles.loadingContainer}>
      <div className={styles.spinner}>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
        <div className={styles.spinnerBlade}></div>
      </div>
      <p className={styles.loadingText}>Loading dashboard data...</p>
    </div>
  );
} 
