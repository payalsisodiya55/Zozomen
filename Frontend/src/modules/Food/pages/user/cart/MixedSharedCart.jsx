import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@food/components/ui/button";
import { useCart } from "@food/context/CartContext";

const RUPEE_SYMBOL = "\u20B9";

const getOrderType = (item) => (item?.orderType === "quick" ? "quick" : "food");

function CartSection({ title, subtitle, items, accentClass, onIncrement, onDecrement }) {
  const sectionTotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${accentClass}`}>
          {items.length} items
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${getOrderType(item)}-${item.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
            <img
              src={item.image || item.imageUrl || "https://placehold.co/96x96?text=Item"}
              alt={item.name || "Item"}
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-900">{item.name || "Item"}</p>
              <p className="truncate text-xs text-slate-500">{item.restaurant || item.quickStoreName || "Store"}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {RUPEE_SYMBOL}
                {Number(item.price || 0).toFixed(0)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
              <button type="button" onClick={() => onDecrement(item)} className="rounded-full p-1 text-slate-600">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-5 text-center text-sm font-bold text-slate-900">{item.quantity || 1}</span>
              <button type="button" onClick={() => onIncrement(item)} className="rounded-full p-1 text-slate-600">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-500">Section subtotal</span>
        <span className="text-base font-black text-slate-900">
          {RUPEE_SYMBOL}
          {sectionTotal.toFixed(0)}
        </span>
      </div>
    </section>
  );
}

export default function MixedSharedCart() {
  const navigate = useNavigate();
  const { cart, updateQuantity } = useCart();

  const foodItems = cart.filter((item) => getOrderType(item) === "food");
  const quickItems = cart.filter((item) => getOrderType(item) === "quick");
  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const increment = (item) => updateQuantity(item.id, Number(item.quantity || 1) + 1);
  const decrement = (item) => updateQuantity(item.id, Number(item.quantity || 1) - 1);

  if (foodItems.length === 0 || quickItems.length === 0) {
    navigate("/food/user/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/food/user")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shopping
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Global cart</h1>
                  <p className="text-sm text-slate-500">
                    Food and quick items are now stored together. Orders still need separate checkout flows.
                  </p>
                </div>
              </div>
            </div>

            <CartSection
              title="Food items"
              subtitle="Restaurant delivery items in your shared cart."
              items={foodItems}
              accentClass="bg-orange-100 text-orange-700"
              onIncrement={increment}
              onDecrement={decrement}
            />

            <CartSection
              title="Quick items"
              subtitle="Essentials and grocery items in your shared cart."
              items={quickItems}
              accentClass="bg-emerald-100 text-emerald-700"
              onIncrement={increment}
              onDecrement={decrement}
            />
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:h-fit">
            <h2 className="text-lg font-black text-slate-900">Cart summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              Use one checkout flow at a time. Keep the other section here until you are ready.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Food items</span>
                <span>{foodItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Quick items</span>
                <span>{quickItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                <span>Combined subtotal</span>
                <span>{RUPEE_SYMBOL}{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button asChild className="h-12 w-full rounded-2xl bg-orange-500 text-white hover:bg-orange-600">
                <Link to="/food/user">Continue food shopping</Link>
              </Button>
              <Button asChild className="h-12 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">
                <Link to="/food/user/quick">Continue quick shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
