import React from 'react';
import SignUpScreen from './auth/signup'; // Component giao diện chính

// Đây là ROUTE Component, tên của file (signup) quyết định đường dẫn (/signup)
export default function SignUpRoute() {
  return <SignUpScreen />;
}