import { Suspense } from 'react';
import { fetchOrders } from '@/app/actions/orders';
import { money } from '@/lib/format';
import { RefreshButton } from '../refresh-button';
import type { SchwabOrder } from '@/lib/schwab-auth';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-white">Orders</h2>
          <p className="text-slate-400 text-sm mt-1">
            Orders from the last 30 days
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersTable />
      </Suspense>
    </div>
  );
}

async function OrdersTable() {
  const { account, orders, error } = await fetchOrders();

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
        <p className="font-semibold">Error loading orders</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 bg-slate-800 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-400">No orders in the last 30 days.</p>
      </div>
    );
  }

  // newest first
  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.enteredTime).getTime() - new Date(a.enteredTime).getTime()
  );

  return (
    <div className="space-y-3">
      {account && (
        <p className="text-slate-400 text-sm">
          Account {account.accountNumber}
        </p>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Entered</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-right">Quantity</th>
              <th className="px-4 py-3 font-medium text-right">Filled</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sorted.map((o) => (
              <OrderRow key={o.orderId} order={o} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: SchwabOrder }) {
  const isBuy = order.instruction.startsWith('BUY');
  return (
    <tr className="hover:bg-slate-700/30 transition-colors">
      <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">
        {formatTime(order.enteredTime)}
      </td>
      <td className="px-4 py-3 font-semibold text-white">{order.symbol}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
            isBuy
              ? 'bg-green-900/40 text-green-300'
              : 'bg-red-900/40 text-red-300'
          }`}
        >
          {order.instruction}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-300 text-sm">{order.orderType}</td>
      <td className="px-4 py-3 text-slate-200 text-right">{order.quantity}</td>
      <td className="px-4 py-3 text-slate-200 text-right">{order.filledQuantity}</td>
      <td className="px-4 py-3 text-slate-200 text-right">
        {order.price !== null ? money(order.price) : '—'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={order.status} />
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'FILLED'
      ? 'bg-green-900/40 text-green-300'
      : status === 'CANCELED' || status === 'REJECTED' || status === 'EXPIRED'
      ? 'bg-slate-700 text-slate-400'
      : status === 'WORKING' || status === 'QUEUED' || status === 'ACCEPTED' || status === 'NEW'
      ? 'bg-blue-900/40 text-blue-300'
      : 'bg-amber-900/40 text-amber-300';

  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${tone}`}>
      {status}
    </span>
  );
}

function formatTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OrdersSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-900/50 border-b border-slate-700" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 border-b border-slate-700/50 last:border-b-0" />
      ))}
    </div>
  );
}
