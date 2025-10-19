import { Brand, Social, Nav, Agreement } from "@/types/blocks/base";

export interface FriendshipLink {
  title: string;
  url: string;
  image: {
    src: string;
    alt?: string;
  };
  target?: string;
}

export interface Footer {
  disabled?: boolean;
  name?: string;
  brand?: Brand;
  nav?: Nav;
  copyright?: string;
  social?: Social;
  agreement?: Agreement;
  friendshipLinks?: {
    title?: string;
    items?: FriendshipLink[];
  };
}
