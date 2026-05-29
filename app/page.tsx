import { redirect } from "next/navigation";

// 首頁直接導向聯絡人列表（middleware 會處理未登入導向 /login）
export default function Home() {
  redirect("/contacts");
}
