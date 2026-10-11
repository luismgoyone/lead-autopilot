export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <div className="flex flex-1 flex-col bg-mist">{children}</div>;
}
