import React from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import TopBarView from "../ui/views/TopBar.view";

/** Brak logiki domenowej – tylko przekładka na widok */
export default function TopBarContainer() {
  return <TopBarView ThemeToggleSlot={<ThemeToggle />} />;
}