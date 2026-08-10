import { useEffect, useState } from "react";
import { FiFileText, FiX } from "react-icons/fi";
import CustomerLayout from "../../layout/customer/CustomerLayout";
import { apiMessage } from "../../lib/api";
import { getCustomerQuotations } from "../../services/quotationService";

const statusTone = {
  pending: "bg-amber-50 text-amber-700",
  quoted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));
}

export default function CustomerQuotations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCustomerQuotations()
      .then(({ data }) => setRows(data.data))
      .catch((requestError) => setError(apiMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerLayout title="My Quotations">
      <section>
        <p className="text-xs font-black uppercase text-teal-700">Customer requests</p>
        <h1 className="text-3xl font-black">My Quotations</h1>

        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        )}

        {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}

        {!loading && !error && rows.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-225 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr>{["Quotation","Product","Seller","Quantity","Requested","Status","Action"].map((heading)=><th key={heading} className="px-5 py-4">{heading}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row)=><tr key={row.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs">{row.quotation_number}</td><td className="px-5 py-4 font-bold">{row.product_name_snapshot}</td><td className="px-5 py-4">{row.seller_company_snapshot}</td><td className="px-5 py-4">{row.quantity}</td><td className="px-5 py-4">{new Date(row.created_at).toLocaleDateString()}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusTone[row.status]}`}>{row.status}</span></td><td className="px-5 py-4"><button onClick={()=>setSelected(row)} className="rounded-xl border px-4 py-2 font-bold">View</button></td></tr>)}</tbody></table></div></div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed bg-white text-center">
            <div><FiFileText className="mx-auto text-4xl text-slate-300" /><h2 className="mt-3 font-black">No quotations yet</h2></div>
          </div>
        )}

        {selected && <QuotationDetails quotation={selected} onClose={() => setSelected(null)} />}
      </section>
    </CustomerLayout>
  );
}

function QuotationDetails({ quotation, onClose }) {
  const details = [
    ["Product", quotation.product_name_snapshot],
    ["Seller", quotation.seller_company_snapshot],
    ["Quantity", `${quotation.quantity} units`],
    ["Status", quotation.status],
    ["Requested", new Date(quotation.created_at).toLocaleDateString()],
    ["Your Message", quotation.customer_message || "—"],
  ];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4">
      <article className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6">
        <div className="flex justify-between"><h2 className="text-2xl font-black">{quotation.quotation_number}</h2><button onClick={onClose}><FiX /></button></div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-400">{label}</dt><dd className="font-bold capitalize">{value}</dd></div>)}
        </dl>
        {quotation.status === "quoted" && <section className="mt-5 rounded-2xl bg-emerald-50 p-4"><h3 className="font-black">Seller Quotation</h3><p>Price per unit: <b>{money(quotation.pricePerUnit)}</b></p><p>Total: <b>{money(quotation.totalPrice)}</b></p><p>Delivery: <b>{quotation.deliveryTime}</b></p><p>{quotation.sellerMessage}</p></section>}
        {quotation.status === "rejected" && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">Reason: {quotation.seller_rejection_reason}</p>}
      </article>
    </div>
  );
}
