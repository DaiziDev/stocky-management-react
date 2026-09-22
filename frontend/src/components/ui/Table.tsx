import { cn } from "@/lib/utils";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export const Table = ({ className, children, ...props }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead className={cn("[&_tr]:border-b", className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
};

export const TableFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tfoot
      className={cn(
        "border-t bg-surface-alt font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
};

export const TableRow = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-surface-hover",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-content-muted [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableCell = ({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
};

export const TableCaption = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) => {
  return (
    <caption
      className={cn("mt-4 text-sm text-content-muted", className)}
      {...props}
    >
      {children}
    </caption>
  );
};
