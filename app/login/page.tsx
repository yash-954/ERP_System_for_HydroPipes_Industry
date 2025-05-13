import React from 'react';
import AuthForm from '../components/AuthForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="login-page">
      {/* Project header */}
      <div className="project-header">
        BTP Project - Group 10 : ERP System for Hydraulics Industries
      </div>
      
      <div className="login-container">
        <h1>Welcome to ERP-IITR</h1>
        <AuthForm />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/debug" style={{ fontSize: '14px', color: '#555' }}>
            Having trouble? Visit Debug Page
          </Link>
        </div>
      </div>
    </div>
  );
} 