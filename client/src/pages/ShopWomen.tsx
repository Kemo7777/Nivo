import Shop from "./Shop";

// The category views share Shop's shell, filters and empty state — only the
// starting category (and therefore the copy) differs.
export default function ShopWomen() {
  return <Shop category="women" />;
}
