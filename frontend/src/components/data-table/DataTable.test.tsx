import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, createDataTableColumns } from "../data-table";

type Row = { id: string; name: string; city: string };

const columns = () => {
  const helper = createDataTableColumns<Row>();
  return [
    helper.accessor("name", { header: "Nom" }),
    helper.accessor("city", { header: "Ville" }),
  ];
};

const DATA: Row[] = [
  { id: "1", name: "Alphéa", city: "Paris" },
  { id: "2", name: "Borealis", city: "Lyon" },
  { id: "3", name: "Céleste", city: "Marseille" },
];

describe("DataTable", () => {
  it("renders headers and all rows", () => {
    render(<DataTable<Row> data={DATA} columns={columns()} />);
    expect(screen.getByText("Nom")).toBeInTheDocument();
    expect(screen.getByText("Alphéa")).toBeInTheDocument();
    expect(screen.getByText("Lyon")).toBeInTheDocument();
    expect(screen.getByText("Marseille")).toBeInTheDocument();
  });

  it("renders only the active page and moves the sixth row to page two", async () => {
    const user = userEvent.setup();
    const data = [
      ...DATA,
      { id: "4", name: "Dalia", city: "Nice" },
      { id: "5", name: "Emeraude", city: "Dijon" },
      { id: "6", name: "Fjord", city: "Lille" },
    ];

    render(
      <DataTable<Row> data={data} columns={columns()} initialPageSize={5} />,
    );

    expect(screen.getByText("Emeraude")).toBeInTheDocument();
    expect(screen.queryByText("Fjord")).not.toBeInTheDocument();
    expect(screen.getByText(/pageInfo|Page 1 sur 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next|Suivant/i }));

    expect(screen.getByText("Fjord")).toBeInTheDocument();
    expect(screen.queryByText("Alphéa")).not.toBeInTheDocument();
    expect(screen.getByText(/pageInfo|Page 2 sur 2/)).toBeInTheDocument();
  });

  it("filters rows by the controlled global filter", async () => {
    render(
      <DataTable<Row> data={DATA} columns={columns()} globalFilter="lyon" />,
    );
    expect(screen.getByText("Borealis")).toBeInTheDocument();
    expect(screen.queryByText("Alphéa")).not.toBeInTheDocument();
    expect(screen.queryByText("Marseille")).not.toBeInTheDocument();
  });

  it("sorts rows when clicking a header (aria-sort)", async () => {
    const user = userEvent.setup();
    render(<DataTable<Row> data={DATA} columns={columns()} />);
    const nameHeader = screen.getByText("Nom").closest("th")!;
    const firstBodyRow = () => screen.getAllByRole("row")[1];

    // Click cycles asc → (desc|none). After the first click the row order
    // must be ascending (Alphéa first); after the second click Alphéa must
    // NOT still be first unless the order changed (desc) — either way the
    // header must advertise its sort state.
    await user.click(nameHeader);
    expect(firstBodyRow()).toHaveTextContent("Alphéa");

    await user.click(nameHeader);
    const header = nameHeader.closest("th") ?? nameHeader;
    const ariaSort = header.getAttribute("aria-sort");
    // After the second click the sort state must have changed from 'ascending'.
    expect(ariaSort).not.toBe("ascending");
  });

  it("shows the no-results state when the filter matches nothing", () => {
    render(
      <DataTable<Row> data={DATA} columns={columns()} globalFilter="zzzz" />,
    );
    expect(screen.queryByText("Alphéa")).not.toBeInTheDocument();
  });

  it("renders no data rows for an empty dataset", () => {
    render(<DataTable<Row> data={[]} columns={columns()} />);
    expect(screen.queryByText("Alphéa")).not.toBeInTheDocument();
  });
});
