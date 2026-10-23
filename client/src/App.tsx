import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ShopWomen from "./pages/ShopWomen";
import ShopMen from "./pages/ShopMen";
import ShopKnitwear from "./pages/ShopKnitwear";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Order from "./pages/Order";
import Contact from "./pages/Contact";
import Info from "./pages/Info";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

// The storefront's route table. The catch-all stays LAST so nothing below it is
// unreachable (App.routes.test.ts asserts this).
export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/shop">{() => <Shop />}</Route>
      <Route path="/shop/women" component={ShopWomen} />
      <Route path="/shop/men" component={ShopMen} />
      <Route path="/shop/knitwear" component={ShopKnitwear} />

      <Route path="/product/:slug" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/order/:code" component={Order} />

      <Route path="/contact" component={Contact} />

      <Route path="/shipping">{() => <Info page="shipping" />}</Route>
      <Route path="/materials">{() => <Info page="materials" />}</Route>
      <Route path="/privacy">{() => <Info page="privacy" />}</Route>
      <Route path="/terms">{() => <Info page="terms" />}</Route>

      <Route path="/admin" component={Admin} />

      {/* Scaffold auth pages, kept so their links resolve. */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={Dashboard} />

      <Route>{() => <div className="p-8">Not found</div>}</Route>
    </Switch>
  );
}
