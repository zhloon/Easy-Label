<template>
  <div class="flex h-screen w-full bg-slate-50 overflow-hidden selection:bg-primary-100 selection:text-primary-700">
    
    <aside class="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div class="h-20 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shadow-sm mr-3">
          <svg viewBox="0 0 100 100" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><g transform="translate(1, -7)"><g transform="translate(50,50) rotate(-40) translate(-50,-50)"><path d="M20,30 h50 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-50 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 z" fill="#1677ff" /><path d="M55,30 h15 a10,10 0 0 1 10,10 v15 L55,30 z" fill="#f59e0b" /><path d="M55,30 v25 h25 L55,30 z" fill="#0f5ee6" opacity="0.6" /></g><path d="M 25 65 L 45 80 L 85 35" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /></g></svg>
        </div>
        <h1 class="text-xl font-black text-slate-900 tracking-tight">易标签 <span class="text-[11px] font-bold text-primary-500 uppercase ml-0.5 tracking-widest">Pro</span></h1>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div class="text-[11px] font-bold text-slate-400 mb-3 px-2 tracking-widest uppercase">主菜单</div>
        <a class="flex items-center gap-3 px-4 py-3.5 bg-primary-50 text-primary-600 rounded-2xl font-bold cursor-pointer shadow-sm border border-primary-100">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          我的标签库
        </a>
        <a class="flex items-center justify-between px-4 py-3.5 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold cursor-not-allowed transition-colors opacity-70 border border-transparent">
          <div class="flex items-center gap-3"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>模板中心</div>
          <span class="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">即将上线</span>
        </a>
      </nav>

      <div class="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div class="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-bl-full pointer-events-none"></div>
          <div class="text-[13px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" class="text-success"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 本机已授权</div>
          <div class="text-[11px] text-slate-400 font-medium mb-4">云端保护运行中</div>
          <button @click="showUnbindModal = true" :disabled="store.isLoading" class="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-danger/20 text-danger hover:bg-danger hover:text-white rounded-xl text-[13px] font-bold transition-all shadow-sm">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> 退出并解绑
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50">
      
      <header class="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shrink-0 z-10">
        <h2 class="text-[16px] font-extrabold text-slate-800 tracking-wide flex items-center gap-2">工作台 <span class="text-slate-300 font-normal">/</span> <span class="text-primary-600">标签管理</span></h2>
        
        <div class="flex items-center gap-2 sm:gap-3">
          <button @click="refreshPage" :disabled="store.isLoading" class="btn btn-subtle text-slate-500 hover:text-primary-600 px-4 h-10 rounded-xl bg-white border border-slate-200 shadow-sm"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>同步刷新</button>
          
          <div class="w-px h-5 bg-slate-200 mx-1"></div>

          <button @click="showMigrationModal = true" :disabled="store.isLoading" class="btn bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 shadow-sm h-10 rounded-xl px-4 transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>
            数据搬家
          </button>

          <button @click="showImportShareModal = true" :disabled="store.isLoading" class="btn text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-100 shadow-sm h-10 rounded-xl px-4"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line><rect x="3" y="19" width="18" height="2" rx="1"></rect></svg>提取分享</button>
          <button @click="triggerJsonImport" :disabled="store.isLoading" class="btn btn-outline bg-white border-slate-200 shadow-sm h-10 rounded-xl px-4"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>导入配置</button>
          <button @click="exportJsonLibrary" :disabled="store.isLoading" class="btn btn-outline bg-white border-slate-200 shadow-sm h-10 rounded-xl px-4"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>导出备份</button>
          <input type="file" ref="jsonInputRef" accept=".json" class="hidden" @change="handleJsonImport" />
        </div>
      </header>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
        
        <div class="flex justify-between items-end mb-6 shrink-0 px-2">
          <div><h2 class="text-2xl font-black text-slate-900 tracking-wide">您的专属模板库</h2><p class="text-sm text-slate-500 font-medium mt-1">数据已云端互联，随时可用</p></div>
          <button @click="openNewEditor" class="btn btn-primary px-8 h-12 rounded-full text-[15px] font-extrabold shadow-lg shadow-primary-500/30 hover:-translate-y-1 transition-all">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>新建空白标签
          </button>
        </div>
        <div class="mb-6 px-2 w-full">
          <div class="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm w-fit">
            <button 
              v-for="plat in platforms" 
              :key="plat.id"
              @click="switchPlatform(plat.id)"
              class="relative flex items-center justify-center px-5 h-10 rounded-xl text-[13px] font-bold transition-all duration-300 z-10 shrink-0 select-none"
              :class="store.currentPlatform === plat.id ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'"
            >
               <div 
                 v-if="store.currentPlatform === plat.id" 
                 class="absolute inset-0 bg-primary-50 rounded-xl -z-10 shadow-[inset_0_1px_4px_rgba(22,119,255,0.1)] border border-primary-100/50"
                 style="animation: fadeScale 0.2s cubic-bezier(0.16, 1, 0.3, 1);"
               ></div>
               {{ plat.name }}
            </button>
          </div>
        </div>
        <div class="relative w-full shrink-0">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-5 lg:gap-6 p-2">
            
            <div v-for="label in store.savedLabels" :key="label.id" class="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative" @click="openEditor(label)">
              <div class="w-full aspect-square bg-slate-50/80 flex items-center justify-center p-6 relative overflow-hidden">
                <LabelThumbnail :label="label" class="max-w-full max-h-full drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
                <div class="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-full shadow-lg border border-slate-100 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
                  <button @click.stop="triggerRenameModal(label)" class="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors tooltip-trigger"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg><div class="tooltip-text">重命名</div></button>
                  <div class="w-px h-4 bg-slate-200"></div>
                  <button @click.stop="uploadLabelToCloud(label)" class="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors tooltip-trigger"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg><div class="tooltip-text">分享</div></button>
                  <div class="w-px h-4 bg-slate-200"></div>
                  <button @click.stop="triggerDeleteModal(label.id)" class="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-danger hover:bg-danger-bg transition-colors tooltip-trigger"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg><div class="tooltip-text text-danger">删除</div></button>
                </div>
              </div>
              <div class="p-4 border-t border-slate-100 bg-white flex justify-center items-center shrink-0">
                <div class="font-bold text-[14px] text-slate-700 truncate group-hover:text-primary-600 transition-colors">{{ label.name }}</div>
              </div>
            </div>
            
            <div v-for="i in (10 - store.savedLabels.length)" :key="'ghost-'+i" class="invisible pointer-events-none flex flex-col shrink-0">
              <div class="w-full aspect-square bg-transparent"></div>
              <div class="p-4 border-t border-transparent"><div class="text-[14px]">&nbsp;</div></div>
            </div>
          </div>

          <div v-if="store.savedLabels.length === 0" class="absolute inset-0 p-2 flex flex-col pointer-events-none z-10">
            <div class="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/80 backdrop-blur-sm pointer-events-auto">
              <span class="font-bold tracking-widest text-[15px] text-slate-500">暂无保存的标签，点击上方按钮开始设计</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center gap-3 mt-4 shrink-0 pb-6">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-outline text-[13px] px-4 py-2 rounded-full shadow-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">上一页</button>
          <span class="text-[13px] font-bold text-slate-500 bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm">
            <span class="text-primary-600 mx-0.5">{{ currentPage }}</span> / {{ totalPages }}
          </span>
          <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn btn-outline text-[13px] px-4 py-2 rounded-full shadow-sm hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">下一页</button>
        </div>

      </div>
    </main>

    <transition name="modal">
      <div v-if="showMigrationModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
        <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col text-center border border-white/50">
          <div class="px-8 py-6 bg-indigo-50/50 border-b border-indigo-100/50">
            <h3 class="font-extrabold text-[18px] text-indigo-600 text-center">选择数据来源</h3>
          </div>
          <div class="p-8 flex flex-col gap-4">
            <button @click="startMigration('shuaishou')" class="btn bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 py-4 rounded-2xl text-[16px] font-bold transition-all shadow-sm flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              甩手工具
            </button>
            <button @click="startMigration('jiatong')" class="btn bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 py-4 rounded-2xl text-[16px] font-bold transition-all shadow-sm flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              佳同工具
            </button>
          </div>
          <div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1">
            <button @click="showMigrationModal = false" class="btn btn-subtle py-3.5 rounded-xl text-[15px]">取消</button>
          </div>
        </div>
      </div>
    </transition>
    <transition name="modal"><div v-if="showRenameModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4"><div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col"><div class="px-8 py-6 bg-slate-50/50 border-b border-slate-100"><h3 class="font-extrabold text-[18px] text-slate-900 text-center">重命名标签</h3></div><div class="p-8"><input v-model="renameValue" type="text" class="input-field w-full text-center text-xl font-bold py-4 rounded-2xl bg-slate-50 focus:bg-white transition-colors outline-none border border-transparent focus:border-primary-300"></div><div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4"><button @click="showRenameModal = false" class="btn btn-subtle py-3.5 rounded-xl">取消</button><button @click="confirmRename" class="btn btn-primary py-3.5 rounded-xl">确认修改</button></div></div></div></transition>
    <transition name="modal"><div v-if="showDeleteModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4"><div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col text-center"><div class="p-8 pt-10"><div class="w-16 h-16 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto mb-5"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div><h3 class="text-xl font-extrabold text-slate-900 mb-2">确认永久删除？</h3><p class="text-sm text-slate-500 font-medium">删除后云端及本地数据将彻底清除。</p></div><div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4"><button @click="showDeleteModal = false" class="btn btn-subtle py-3.5 rounded-xl">取消</button><button @click="confirmDeleteLabel" class="btn btn-danger py-3.5 rounded-xl">确认删除</button></div></div></div></transition>
    <transition name="modal"><div v-if="showImportShareModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4"><div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col"><div class="px-8 py-6 bg-primary-50/50 border-b border-primary-100/50"><h3 class="font-extrabold text-[18px] text-primary-600 text-center">提取分享模板</h3></div><div class="p-8"><input v-model="inputShareCode" type="text" placeholder="输入 6 位分享码" maxlength="6" class="input-field w-full text-center text-2xl font-black uppercase tracking-[0.2em] py-4 rounded-2xl bg-slate-50 text-primary-600 focus:bg-white outline-none border border-transparent focus:border-primary-300"></div><div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4"><button @click="showImportShareModal = false" class="btn btn-subtle py-3.5 rounded-xl">取消</button><button @click="confirmImportShare" class="btn btn-primary py-3.5 rounded-xl">确认获取</button></div></div></div></transition>
    <transition name="modal"><div v-if="showShareResultModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4"><div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col text-center"><div class="p-8 pt-10"><div class="w-16 h-16 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div><h3 class="text-xl font-extrabold text-slate-900 mb-2">云端分享成功</h3><p class="text-sm text-slate-500 font-medium mb-6">您的朋友可以通过此分享码获取该模板</p><div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-5 text-4xl font-black text-primary-600 tracking-[0.25em] mb-2 select-all cursor-copy" @click="copyShareCode">{{ displayShareCode }}</div></div><div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4"><button @click="showShareResultModal = false" class="btn btn-subtle py-3.5 rounded-xl">关闭</button><button @click="copyShareCode" class="btn btn-primary py-3.5 rounded-xl">复制分享码</button></div></div></div></transition>
  </div>
  <transition name="modal">
    <div v-if="showUnbindModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[380px] overflow-hidden flex flex-col text-center border border-white/50">
        <div class="p-8 pt-10">
          <div class="w-16 h-16 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path><line x1="4" y1="4" x2="20" y2="20"></line></svg>
          </div>
          <h3 class="text-xl font-extrabold text-slate-900 mb-2">确认解除设备绑定？</h3>
          <p class="text-sm text-slate-500 font-medium leading-relaxed">解绑后本设备将失去且清除本地数据，请慎重操作。</p>
        </div>
        <div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-4">
          <button @click="showUnbindModal = false" class="btn btn-subtle py-3.5 rounded-xl text-[15px]">取消保留</button>
          <button @click="confirmUnbindDevice" class="btn btn-danger py-3.5 rounded-xl text-[15px]">确认解绑</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ipcRenderer } from 'electron';
import { useMainStore } from '../store/useMainStore';
// 🌟 核心：引入了 saveBatchToLocal 和 saveBatchLabels 用于搬家
import { apiUnbindLicense, apiPost, apiGet, clearLocalCache, saveLabel, deleteLabel, clearAndImportDB, saveBatchToLocal, saveBatchLabels } from '../utils/db';
import type { LabelData } from '../types';
import LabelThumbnail from '../components/LabelThumbnail.vue';

// 平台配置字典
const platforms = [
  { id: 'TEMU', name: 'TEMU' },
  { id: 'SHEIN', name: 'SHEIN' },
  { id: 'TIKTOK', name: 'TIKTOK' },
  { id: 'ALIEXPRESS', name: 'ALIEXPRESS' },
  { id: 'AMAZON', name: 'AMAZON' },
  { id: 'EMAG', name: 'EMAG' },
  { id: 'OTHER', name: '其他' }
];

// 切换平台分类
async function switchPlatform(platformId: string) {
  if (store.currentPlatform === platformId) return; // 重复点击拦截
  
  store.currentPlatform = platformId;
  currentPage.value = 1;
  store.showLoading('加载中...');
  await store.fetchLabels(1, 10);
  store.hideLoading();
}

const store = useMainStore();
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(store.totalLabels / 10)));

onMounted(async () => {
    if (store.currentView === 'dashboard' && store.savedLabels.length === 0) {
        await store.fetchLabels(1, 10);
    }
});

async function refreshPage() { 
    currentPage.value = 1;
    await store.fetchLabels(1, 10); 
    (window as any).showToast('数据已同步', 'success'); 
}

async function changePage(page: number) { 
    if (page < 1 || page > totalPages.value) return; 
    currentPage.value = page; 
    await store.fetchLabels(page, 10); 
}

function openEditor(label: LabelData) { store.currentLabel = JSON.parse(JSON.stringify(label)); store.setView('editor'); }
function openNewEditor() { 
  // 🌟 判断当前选中的平台。如果是 "ALL" (全部)，则默认分配到 "OTHER"
  const targetPlatform = store.currentPlatform === 'ALL' ? 'OTHER' : store.currentPlatform;

  store.currentLabel = { 
    id: Date.now().toString(), 
    name: '新建标签', 
    wMM: 100, 
    hMM: 100, 
    elements: [],
    platform: targetPlatform // 🌟 核心：将平台参数传给新建的标签画布数据
  }; 
  
  store.setView('editor'); 
}

const showRenameModal = ref(false);
const renameValue = ref('');
const activeLabel = ref<LabelData | null>(null);
const showDeleteModal = ref(false);
const deleteTargetId = ref('');

function triggerRenameModal(label: LabelData) { activeLabel.value = label; renameValue.value = label.name; showRenameModal.value = true; }
function triggerDeleteModal(id: string) { deleteTargetId.value = id; showDeleteModal.value = true; }

async function confirmRename() {
    if (!renameValue.value.trim() || !activeLabel.value) return;
    store.showLoading('正在重命名...');
    try {
        const rawLabel = JSON.parse(JSON.stringify(activeLabel.value)); rawLabel.name = renameValue.value.trim();
        await saveLabel(rawLabel); 
        const idx = store.savedLabels.findIndex(l => l.id === rawLabel.id);
        if (idx > -1) store.savedLabels[idx].name = rawLabel.name;
        showRenameModal.value = false; (window as any).showToast('重命名成功', 'success');
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

async function confirmDeleteLabel() {
    store.showLoading('正在删除...');
    try {
        await deleteLabel(deleteTargetId.value); 
        
        let targetPage = currentPage.value;
        if (store.savedLabels.length === 1 && currentPage.value > 1) {
            targetPage -= 1;
        }
        currentPage.value = targetPage;
        await store.fetchLabels(targetPage, 10, false, true); // 删除后优先查本地
        
        showDeleteModal.value = false; 
        (window as any).showToast('已永久删除', 'success');
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

const showUnbindModal = ref(false);

async function confirmUnbindDevice() {
    store.showLoading('正在向云端申请解绑...');
    showUnbindModal.value = false;
    try {
        const key = localStorage.getItem('easy_label_vip_key');
        if (!key) throw new Error('本地未找到授权卡密');
        const res = await apiUnbindLicense(key);
        if (res.success) {
            await clearLocalCache();
            localStorage.removeItem('easy_label_vip_key'); 
            store.savedLabels = [];
            store.setView('login');
            (window as any).showToast(res.message || '解绑成功，已退出', 'success');
        } else throw new Error(res.error || '解绑失败');
    } catch (err: any) { (window as any).showToast(err.message, 'error'); } finally { store.hideLoading(); }
}

// 传入 platform 参数：'shuaishou' | 'jiatong'
async function startMigration(platform: string) {
  showMigrationModal.value = false; // 关闭选择弹窗
  store.showLoading('正在检测登录状态...');

  const progressHandler = (_: any, message: string) => {
    if (message === 'WAITING_LOGIN') {
      store.hideLoading();
      (window as any).showToast('请在弹出的窗口中登录账号', 'info');
    } else {
      store.showLoading(message);
    }
  };
  
  ipcRenderer.on('migration-progress', progressHandler);

  try {
    // 🌟 每次都需要重新登录获取 token
    const result = await ipcRenderer.invoke('migrate-labels', platform);
    ipcRenderer.off('migration-progress', progressHandler);

    if (result && result.success) {
      const labels = result.labels || [];
      if (labels.length === 0) {
        store.hideLoading();
        return (window as any).showToast('目标系统内没有找到任何标签', 'info');
      }

      try {
        await saveBatchLabels(labels); 
      } catch (cloudErr: any) {
        store.hideLoading();
        return (window as any).showToast(cloudErr.message || '云端保存失败，已终止搬家', 'error');
      }
      
      await saveBatchToLocal(labels); 
      
      currentPage.value = 1;
      await store.fetchLabels(1, 10, false, true);
      
      store.hideLoading();
      (window as any).showToast(`搬家成功！已成功导入 ${labels.length} 个标签`, 'success');
      
    } else {
      store.hideLoading();
      if (result && result.error && result.error.includes('窗口已关闭')) {
        (window as any).showToast('已取消迁移', 'info');
      } else {
        (window as any).showToast(result?.error || '迁移失败', 'error');
      }
    }
  } catch (err: any) {
    console.error('搬家过程出错:', err);
    store.hideLoading();
    ipcRenderer.off('migration-progress', progressHandler);
    (window as any).showToast('通信失败，请检查网络', 'error');
  }
}

const showImportShareModal = ref(false);
const showMigrationModal = ref(false); // 控制搬家选择弹窗
const inputShareCode = ref('');
const showShareResultModal = ref(false);
const displayShareCode = ref('');

async function uploadLabelToCloud(label: LabelData) {
    store.showLoading('生成分享码中...');
    try {
        const res: any = await apiPost('/api/share', JSON.parse(JSON.stringify(label)));
        if (!res.success) throw new Error(res.error || '失败');
        displayShareCode.value = res.shareCode; showShareResultModal.value = true;
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

function copyShareCode() { navigator.clipboard.writeText(displayShareCode.value); (window as any).showToast('已复制', 'success'); }

async function confirmImportShare() {
    const code = inputShareCode.value.trim().toUpperCase();
    if (!code || code.length !== 6) return (window as any).showToast('请输入 6 位分享码', 'warning');
    store.showLoading('正在获取...');
    try {
        const res: any = await apiGet(`/api/share/${code}`);
        if (!res.success) throw new Error(res.error || '过期或无效');
        const sharedLabel = res.labelData;
        sharedLabel.id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
        sharedLabel.name = sharedLabel.name + ' (分享导入)';
        await saveLabel(sharedLabel); 
        if (currentPage.value === 1) {
            store.savedLabels.unshift(sharedLabel);
            if (store.savedLabels.length > 10) store.savedLabels.pop();
        }
        store.totalLabels++;
        showImportShareModal.value = false; inputShareCode.value = '';
        (window as any).showToast('获取成功', 'success');
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

const jsonInputRef = ref<HTMLInputElement | null>(null);
function exportJsonLibrary() {
    const dataStr = JSON.stringify(store.savedLabels, null, 2); const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
    link.download = `易标签_本地备份_${new Date().toLocaleDateString().replace(/\//g, '')}.json`;
    link.click(); URL.revokeObjectURL(url);
}
function triggerJsonImport() { jsonInputRef.value?.click(); }
function handleJsonImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target?.result as string);
            store.showLoading('导入中...'); await clearAndImportDB(data); await store.fetchLabels(1, 10);
        } catch (err) {} finally { store.hideLoading(); if (jsonInputRef.value) jsonInputRef.value.value = ''; }
    }; reader.readAsText(file);
}
</script>

<style scoped>
@reference "../style.css"; 

.modal-enter-active, .modal-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.tooltip-trigger .tooltip-text { @apply absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg opacity-0 transition-all pointer-events-none whitespace-nowrap; }
.tooltip-trigger:hover .tooltip-text { @apply opacity-100 -translate-y-1; }
.tooltip-trigger .tooltip-text::after { content: ''; @apply absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900; }
</style>