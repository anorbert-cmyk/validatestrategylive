import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizableTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

interface ResizableTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface ResizableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  width?: number;
  onResize?: (width: number) => void;
}

interface ResizableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

interface ResizableTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

interface ResizableTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const ResizableTable = React.forwardRef<HTMLTableElement, ResizableTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm table-fixed", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
ResizableTable.displayName = "ResizableTable";

const ResizableTableHeader = React.forwardRef<HTMLTableSectionElement, ResizableTableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props}>
        {children}
      </thead>
    );
  }
);
ResizableTableHeader.displayName = "ResizableTableHeader";

const ResizableTableHead = React.forwardRef<HTMLTableCellElement, ResizableTableHeadProps>(
  ({ className, children, minWidth = 80, maxWidth = 500, resizable = true, onResize, width: controlledWidth, style, ...props }, ref) => {
    const [widthState, setWidthState] = React.useState<number | undefined>(undefined);
    const width = controlledWidth !== undefined ? controlledWidth : widthState;
    const [isResizing, setIsResizing] = React.useState(false);
    const startXRef = React.useRef<number>(0);
    const startWidthRef = React.useRef<number>(0);
    const thRef = React.useRef<HTMLTableCellElement | null>(null);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      if (!resizable) return;
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = thRef.current?.offsetWidth || 0;
    }, [resizable]);

    React.useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - startXRef.current;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff));
        setWidthState(newWidth);
        onResize?.(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isResizing, minWidth, maxWidth]);

    return (
      <th
        ref={(node) => {
          thRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 relative select-none",
          isResizing && "cursor-col-resize",
          className
        )}
        style={{ ...style, width: (controlledWidth || width || style?.width) ? `${controlledWidth || width || style?.width}px` : undefined }}
        {...props}
      >
        <div className="truncate pr-2">{children}</div>
        {resizable && (
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors",
              isResizing && "bg-primary"
            )}
            onMouseDown={handleMouseDown}
          />
        )}
      </th>
    );
  }
);
ResizableTableHead.displayName = "ResizableTableHead";

const ResizableTableBody = React.forwardRef<HTMLTableSectionElement, ResizableTableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props}>
        {children}
      </tbody>
    );
  }
);
ResizableTableBody.displayName = "ResizableTableBody";

const ResizableTableRow = React.forwardRef<HTMLTableRowElement, ResizableTableRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
ResizableTableRow.displayName = "ResizableTableRow";

const ResizableTableCell = React.forwardRef<HTMLTableCellElement, ResizableTableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          "p-2 align-middle [&:has([role=checkbox])]:pr-0 overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="truncate">{children}</div>
      </td>
    );
  }
);
ResizableTableCell.displayName = "ResizableTableCell";

export {
  ResizableTable,
  ResizableTableHeader,
  ResizableTableHead,
  ResizableTableBody,
  ResizableTableRow,
  ResizableTableCell,
};
