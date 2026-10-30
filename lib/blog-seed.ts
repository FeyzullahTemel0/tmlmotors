export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
};

export const publicBlogSeed: PublicBlogPost[] = [
  {
    id: "blog-1",
    title: "Araç alım satımında doğru iletişim neden önemlidir?",
    slug: "arac-alim-satiminda-dogru-iletisim",
  },
  {
    id: "blog-2",
    title: "İkinci el araçta ekspertiz sürecine hazırlık",
    slug: "ikinci-el-aracta-ekspertiz-sureci",
  },
];
