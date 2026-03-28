import usePageTitle from "@/hooks/usePageTitle";
import { FC } from "react";
import Footer from "./components/Footer";
import { GlobalNavbar } from "@/components/navigation/GlobalNavbar";
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation";

type Props = {
  title?: string;
  children: React.ReactNode;
  showBreadcrumb?: boolean;
};

const PortalLayout: FC<Props> = ({ title, children, showBreadcrumb = true }) => {
  usePageTitle(title);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <GlobalNavbar />
      
      {showBreadcrumb && <BreadcrumbNavigation />}

      <main className="flex-1 py-8">
        <div className="page-container">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 mb-8 sr-only">
              {title}
            </h1>
          )}

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PortalLayout;
