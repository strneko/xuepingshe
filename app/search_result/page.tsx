import CategoriesBar from "./components/categories_bar";
import ResultsList from "./components/results_list";

// 结果页包含分类bar和搜索结果列表两部分
// 结果页在初始化时从url获取参数.默认搜索所有种类;
// 点击搜索结果页的分类标签时,更改请求参数中的种类,重新请求数据
// 搜索结果列表组件负责展示搜索结果,并在用户向下滚动时,如果距离底部不足100px,则加载下一页数据.每页20条数据
export default async function SearchPage() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-4 px-[10vw]">
      <CategoriesBar />
      <ResultsList />
    </div>
  );
}
