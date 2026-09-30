import { GlobalLoadingOverlay } from "@/components/loading/GlobalLoading";

export default function ConnectExtensionLoading() {
  return <GlobalLoadingOverlay message="Đang kết nối Chrome Extension..." />;
}
