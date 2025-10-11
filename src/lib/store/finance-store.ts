import { create } from 'zustand';
import type { PaymentMethod, PaymentType, Payment } from '@/lib/types';

interface FinanceState {
  paymentMethods: PaymentMethod[];
  paymentTypes: PaymentType[];
  payments: Payment[];
  isInitialized: boolean;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  setPaymentTypes: (types: PaymentType[]) => void;
  addPaymentType: (type: PaymentType) => void;
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  initialize: (data: { methods: PaymentMethod[], types: PaymentType[], payments: Payment[] }) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  paymentMethods: [],
  paymentTypes: [],
  payments: [],
  isInitialized: false,
  setPaymentMethods: (methods) => set({ paymentMethods: methods, isInitialized: true }),
  addPaymentMethod: (method) => set((state) => ({
    paymentMethods: [method, ...state.paymentMethods]
  })),
  setPaymentTypes: (types) => set({ paymentTypes: types, isInitialized: true }),
  addPaymentType: (type) => set((state) => ({
    paymentTypes: [type, ...state.paymentTypes]
  })),
  setPayments: (payments) => set({ payments: payments, isInitialized: true }),
  addPayment: (payment) => set((state) => ({
    payments: [payment, ...state.payments]
  })),
  initialize: (data) => set({
    paymentMethods: data.methods,
    paymentTypes: data.types,
    payments: data.payments,
    isInitialized: true
  }),
}));
