import { useNavigate } from "react-router-dom";
import CategoryCard from "./CategoryCard";

const CATEGORIES = [
  { label: "Ficción", icon: "auto_stories", color: "bg-primary/40 group-hover:bg-primary/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj92CapJ71H32g3PqPo4UpdFGT16MKVHk_5irXvuuMte0fcAvrBEM6YfBbQL02MtpUpGGu7yTZgqDX80Ly1F2anuMgG1obniaofo1ZXECzws6hSGMjsO4YyKgosOCs8NClFWI_bqiCbjVqumsWgUIk3_R50k46p8f6f37yDrfLKAkFN89pfd_-D6alk4QM9lUCYcVvmsAe1un_If6H0WEzHQu2mlPe81NWsroy0EalKn0LZ8suTosOkDEcStGGuAOxigAmmcoHOa4" },
  { label: "Historia", icon: "history_edu", color: "bg-purple-500/40 group-hover:bg-purple-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3gfAc6vHx4pZLusm5aSDvhMtTA6PW_Ckgrqr4QckuarhsHciYD6cEQoNqJtlrC0gI3vQ3JfbJC_PRyy9s1ohJzSjPk5uob3p1yf8GmJcloKzt1jn7QlhueGa33C5qeAdWiShBdrf_0jSg8lsyNCiFI_MD_46XIO2BH417WoST327GvfyPANzwtTqwMft2R3EOilx-gAmsZgkfoTQvfxdT0-_Sq6NGb_vKQ_77ODQU0NUwjvRQ0UqgoCSZur8M7Z4w0f0_5-tStPc" },
  { label: "Ciencia", icon: "science", color: "bg-emerald-500/40 group-hover:bg-emerald-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Q0QbGWsCEYGrifim-n2YkOFtfIkSK15Uau5-tlcFFymTMDLMyUqSxatS8z0t3FyeTHQLDg3l2ieNVm1nDnhizd6ImtNtqs1myPqdAjcEWXxINP3v-XKR1yKCKTBZWfkszUeLiYy8-huD1FlyOKqj9taM3TLfVXwgyKo67m2WJTahQ2HMKBcxTRKytbCh73O7O4g2LnUUOI_gXFk6OgrVuz0YriM3iyDiq9YWNFNpEPXr_3vja84VU9ihyTK6_chU58eus2IT3WE" },
  { label: "Misterio", icon: "psychology", color: "bg-orange-500/40 group-hover:bg-orange-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMbAC2gGqglYh05xZgz0wkZKimew54sAXsMNKJWk2JaBXGlO4fb8w5PPdC94hZ8yhLszgOHJKFQLfgznv7r_GLVNggvaspBYEKMrbmAELuyrPArSpoIK6NeSJHe-3QxYeEr8ErRPyLW0gChGYmlBSbQih0BrN0aZrXTOWDapKswqRgHcIYY84WdW7Io0lzisiYHSWVomWdfvo96y7qhlSnKdUWlU4j4jQ6PeJXaIJF_zbBxTC2kW3aRagXkOW3pVGs5J7i5zyovQE" },
  { label: "Romance", icon: "favorite", color: "bg-pink-500/40 group-hover:bg-pink-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBYtIRnkOQ4pBzCuAALLyHAnoexOUmBFuUmgOguHMof-T_hO8_jf4cLzODGS8IAHD-bTTLMR6GV-7AyIer5e9qhdAlwOz1xkYWVfnQQbzmQiyG5aM4zSaXRJoFlxelpwWfY51FDtvwO8EB2Pvks3793yMZ4cLA7gTDCpmZII5ToxWHgQcuTKoMKfyub_Bvhia7h_T8Gm6pOPMgmja1XIaBnzW0tFJSWfiX4MUBBhNj_asUSwf1zB_zQOJsgZKZwyh7Y3xsnMbuH_g" },
  { label: "Ver Más", icon: "grid_view", color: "bg-slate-500/40 group-hover:bg-slate-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2LdW0UPI9mIYs2Hjx5xqN2m9t64xACvkq3lnNg45B6_fVuyKoMpwUSU_t7Bsloc9sVGYJw7ioX5L-b4cS_UhcVkN6vj5R2PiXiB5bsKfEO8TAksWcwjJh-ixiXs9iLfCmwSoAdpsf9n_xMvk91N9CcAGp6qmVEE6UxVk0rgVIKuKx2_5Khe-p3YC7LLa00vO57_xr0ZHEC0jfp4gLdj0CDdavYxklcdxgZdujCB_w8WTRWJ_GBcPLKxMOXzbhOAyGaniZ8sJxmA0" },
];

function CategoriesSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <h2 className="text-3xl font-bold text-white mb-12 text-center">Explora por Categorías</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {CATEGORIES.map((cat, i) => (
          <CategoryCard key={i} {...cat} />
        ))}
      </div>
    </section>
  );
}

export default CategoriesSection;