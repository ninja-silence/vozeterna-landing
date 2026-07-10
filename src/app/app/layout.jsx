import AppNavigation from "../../components/app/AppNavigation";

export default function VozEternaAppLayout({ children }) {
  return (
    <>
      <AppNavigation />
      {children}
    </>
  );
}