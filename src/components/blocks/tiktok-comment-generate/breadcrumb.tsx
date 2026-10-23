"use client";

import PageBreadcrumb from "@/components/blocks/breadcrumb";

interface WrapperProps {
  homeText: string;
  currentText: string;
}

export default function TiktokCommentBreadcrumb({ homeText, currentText }: WrapperProps) {
  return <PageBreadcrumb homeText={homeText} currentText={currentText} />;
}
