import React from "react";
import ContextMenuView from "../ui/views/ContextMenu.view";

/** Bez zmian logiki; tylko przekładka do widoku */
const ContextMenuContainer = React.forwardRef(function ContextMenuContainer(props, ref) {
  return <ContextMenuView ref={ref} {...props} />;
});

export default ContextMenuContainer;
