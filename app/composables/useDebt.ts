export interface CustomerDebt {
  customerId: number
  customerName: string
  totalDebt: number
  updatedAt: string
}

export interface PayDebtPayload {
  customerId: number
  amount: number
  paymentMethod: string
  notes?: string
}

export interface ManualDebtPayload {
  customerId: number
  customerName: string
  amount: number
  notes?: string
}

export const useDebt = () => {
  const { $api } = useNuxtApp()

  // 1. Ambil daftar semua pelanggan yang punya hutang
  const getDebts = async (status: 'unpaid' | 'paid' | 'all' = 'unpaid'): Promise<CustomerDebt[]> => {
    const res = await $api.get('/debt', {
      params: { status }
    })
    return res.data
  }

  // 2. Ambil saldo 1 pelanggan
  const getCustomerBalance = async (customerId: number) => {
    const res = await $api.get(`/debt/customers/${customerId}/balance`)
    return res.data
  }

  // 3. Bayar hutang bon
  const payDebt = async (payload: PayDebtPayload) => {
    const res = await $api.post('/debt/pay', payload)
    return res.data
  }

  // 4. Tambah hutang manual
  const addManualDebt = async (payload: ManualDebtPayload) => {
    const res = await $api.post('/debt/manual', payload)
    return res.data
  }

  // 5. Riwayat mutasi / ledger
  const getHistory = async (customerId: number) => {
    const res = await $api.get(`/debt/customers/${customerId}/history`)
    return res.data
  }

  return {
    getDebts,
    getCustomerBalance,
    payDebt,
    addManualDebt,
    getHistory
  }
}