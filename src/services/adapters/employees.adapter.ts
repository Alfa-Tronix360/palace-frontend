import { http } from '@/services/api/http'
import type { Employee, EmployeeOrder } from '@/types'

function normalizeEmployee(item: any): Employee {
  return {
    id: String(item.id),
    name: item.name,
    phone: item.phone,
    role: item.role,
    tableId: item.table_id ? String(item.table_id) : undefined,
    assignedTables: (item.assigned_tables || []).map((at: any) => ({
      id: String(at.id),
      tableId: String(at.table_id),
      tableNumber: at.table_number,
    })),
    active: item.active ?? true,
    createdAt: new Date(item.created_at),
  }
}

function normalizeOrder(item: any): EmployeeOrder {
  return {
    id: String(item.id),
    code: item.code,
    employeeId: String(item.employee_id),
    employeeName: item.employee_name,
    tableId: String(item.table_id),
    tableNumber: item.table_number,
    items: item.items,
    total: item.total,
    createdAt: new Date(item.created_at),
  }
}

export const employeesAdapter = {
  async getAll(): Promise<Employee[]> {
    const data = await http.get<unknown, any[]>('/employees')
    return data.map(normalizeEmployee)
  },

  async create(data: { name: string; phone: string; role: string; table_id?: number }): Promise<Employee> {
    const employee = await http.post<unknown, any>('/employees', data)
    return normalizeEmployee(employee)
  },

  async assignTable(id: string, tableId?: string): Promise<Employee> {
    const employee = await http.post<unknown, any>(`/employees/${id}/assign-table`, {
      table_id: tableId ? Number(tableId) : null,
    })
    return normalizeEmployee(employee)
  },

  async toggleTable(employeeId: string, tableId: string): Promise<Employee> {
    const employee = await http.post<unknown, any>(`/employees/${employeeId}/toggle-table/${tableId}`, {})
    return normalizeEmployee(employee)
  },

  async getOrders(): Promise<EmployeeOrder[]> {
    const data = await http.get<unknown, any[]>('/employee-orders')
    return data.map(normalizeOrder)
  },

  async createOrder(data: { employeeId: string; tableId: string; items: { name: string; quantity: number; price: number }[] }): Promise<EmployeeOrder> {
    const order = await http.post<unknown, any>('/employee-orders', {
      employee_id: Number(data.employeeId),
      table_id: Number(data.tableId),
      items: data.items,
    })
    return normalizeOrder(order)
  },
}