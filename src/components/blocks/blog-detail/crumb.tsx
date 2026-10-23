import PageBreadcrumb from "@/components/blocks/breadcrumb";
import { Post } from "@/types/post";
import { useTranslations } from "next-intl";

export default function Crumb({ post }: { post: Post }) {
  const t = useTranslations();

  return (
    <PageBreadcrumb
      homeText={t("blog.home")}
      hubText={t("blog.title")}
      hubHref="/posts"
      currentText={post.title ?? ""}
    />
  );
}
