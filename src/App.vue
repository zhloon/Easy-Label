<template>
  <div class="h-screen w-screen overflow-hidden bg-[#f3f4f6] text-[#1f2937] font-sans relative">
    
    <div v-if="isLoading" class="fixed inset-0 bg-[#00000099] z-[9999] flex flex-col items-center justify-center backdrop-blur-sm transition-opacity">
      <div class="w-10 h-10 border-4 border-white/20 border-t-[#1677ff] rounded-full animate-spin"></div>
      <p class="text-white mt-4 font-bold tracking-widest text-sm">{{ loadingText }}</p>
      <div v-if="loadingProgress !== null" class="w-64 h-2 bg-[#ffffff33] rounded-full mt-4 overflow-hidden shadow-inner">
        <div class="h-full bg-[#10b981] transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.8)]" :style="{ width: `${loadingProgress}%` }"></div>
      </div>
    </div>

    <div v-if="currentView === 'dashboard'" class="max-w-[1300px] mx-auto p-8 h-full flex flex-col">
      <header class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-8 border border-[#e5e7eb] shrink-0">
        <h1 class="text-2xl font-extrabold text-[#1f2937] flex items-center gap-2 tracking-wide">
          <svg viewBox="0 0 100 100" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(50,50) rotate(-40) translate(-50,-50)">
                  <path d="M20,30 h50 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-50 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 z" fill="#1b6Cff"/>
                  <path d="M55,30 h15 a10,10 0 0 1 10,10 v15 L55,30 z" fill="#ff8a3d"/>
                  <path d="M55,30 v25 h25 L55,30 z" fill="#1455c0" opacity="0.6"/>
              </g>
              <path d="M 25 65 L 45 80 L 85 35" fill="none" stroke="#ff8a3d" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          易标签 <span class="text-sm font-bold text-[#9ca3af] ml-1 tracking-normal">Easy Label</span>
        </h1>
        <div class="flex gap-3">
          <button @click="refreshPage" class="btn btn-outline text-[#6b7280] hover:text-[#1677ff]">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> 刷新
          </button>
          <div class="w-px h-5 bg-[#e5e7eb] mt-2 mx-1"></div>
          <button @click="showImportShareModal = true" class="btn btn-outline text-[#0284c7] border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>提取分享码
          </button>
          <button @click="triggerJsonImport" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>导入本地库
          </button>
          <button @click="exportJsonLibrary" class="btn btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>导出本地库
          </button>
          <input type="file" ref="jsonInputRef" accept=".json" class="hidden" @change="handleJsonImport" />
        </div>
      </header>

      <div class="flex justify-between items-center mb-4 border-b-2 border-[#e5e7eb] pb-3 shrink-0">
        <h2 class="text-[17px] font-extrabold text-[#1f2937] tracking-wide">我的标签库</h2>
        <button @click="showNewModal = true" class="btn bg-gradient-to-r from-[#1677ff] to-[#3b82f6] text-white px-7 py-3 rounded-xl font-extrabold shadow-[0_6px_20px_rgba(22,119,255,0.3)] hover:shadow-[0_8px_25px_rgba(22,119,255,0.45)] hover:-translate-y-0.5 transform transition-all duration-300 flex items-center gap-2 text-[15px] tracking-wide border-none outline-none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          新建标签
        </button>
      </div>

      <div class="w-full h-[516px] overflow-y-auto custom-scrollbar pr-2 shrink-0">
        <div v-if="savedLabels.length === 0" class="w-full py-20 flex flex-col items-center text-[#9ca3af] border-2 border-dashed border-[#d1d5db] rounded-2xl bg-white shadow-sm">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-4 text-[#d1d5db]"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span class="font-medium tracking-widest text-sm">暂无标签，请点击上方“新建标签”开始设计</span>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-1">
          <div v-for="label in savedLabels" :key="label.id" class="h-[240px] bg-white border border-[#e5e7eb] rounded-2xl flex flex-col overflow-hidden hover:-translate-y-1.5 hover:border-[#1677ff] hover:shadow-[0_12px_24px_rgba(22,119,255,0.15)] transition-all duration-300 group">
            <div class="flex-1 cursor-pointer overflow-hidden relative bg-[#f8fafc]" @click="openEditor(label)">
               <LabelThumbnail :label="label" />
               <div class="absolute inset-0 bg-[#0000000d] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span class="bg-[#ffffffeb] text-[#1677ff] text-xs font-bold px-4 py-2 rounded-full shadow-md backdrop-blur-sm tracking-widest flex items-center gap-1">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 点击编辑
                 </span>
               </div>
            </div>
            <div class="p-3 border-t border-[#f3f4f6] bg-white">
              <div class="font-bold text-[13px] text-center truncate mb-2.5 text-[#374151]" :title="label.name">{{ label.name }}</div>
              <div class="flex gap-2 justify-between">
                <button @click.stop="triggerRenameModal(label)" class="flex-1 py-2 bg-[#f1f5f9] hover:bg-[#eff6ff] text-[#6b7280] hover:text-[#1677ff] rounded-lg transition-colors flex justify-center border border-transparent" title="重命名标签"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button @click.stop="uploadLabelToCloud(label)" class="flex-1 py-2 bg-[#f1f5f9] hover:bg-[#eff6ff] text-[#6b7280] hover:text-[#0284c7] rounded-lg transition-colors flex justify-center border border-transparent" title="提取云端分享码"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
                <button @click.stop="triggerDeleteModal(label.id)" class="flex-1 py-2 bg-[#f1f5f9] hover:bg-[#fef2f2] text-[#6b7280] hover:text-[#ff4d4f] rounded-lg transition-colors flex justify-center border border-transparent" title="永久删除标签"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-10 mb-4 border-b-2 border-[#e5e7eb] pb-3 shrink-0">
        <h2 class="text-[17px] font-extrabold text-[#1f2937] tracking-wide">模板库</h2>
      </div>
      <div class="w-full py-12 flex flex-col items-center text-[#9ca3af] border-2 border-dashed border-[#d1d5db] rounded-2xl bg-white shadow-sm shrink-0">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
        <span class="font-medium tracking-widest text-sm">模板库正在建设中...</span>
      </div>
    </div>

    <div v-else-if="currentView === 'editor'" class="fixed inset-0 z-[100] bg-[#000000b3] backdrop-blur-sm flex items-center justify-center p-8">
      <div class="bg-white rounded-2xl shadow-2xl flex flex-col w-full h-full max-w-[1400px] overflow-hidden transform transition-all border border-[#4b55634d]">
        
        <header class="h-[68px] flex items-center justify-between px-6 bg-white border-b border-[#e5e7eb] shrink-0 z-[110]">
          <div class="flex items-center gap-2 bg-[#f1f5f9] border border-[#e5e7eb] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#dbeafe] transition-shadow w-80">
            <svg viewBox="0 0 100 100" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(50,50) rotate(-40) translate(-50,-50)">
                    <path d="M20,30 h50 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-50 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 z" fill="#1b6Cff"/>
                    <path d="M55,30 h15 a10,10 0 0 1 10,10 v15 L55,30 z" fill="#ff8a3d"/>
                    <path d="M55,30 v25 h25 L55,30 z" fill="#1455c0" opacity="0.6"/>
                </g>
                <path d="M 25 65 L 45 80 L 85 35" fill="none" stroke="#ff8a3d" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input v-model="currentLabel.name" class="flex-1 text-[15px] font-bold bg-transparent outline-none text-[#1f2937] placeholder-[#9ca3af]" placeholder="未命名标签" />
          </div>
          <div class="flex gap-3">
            <button @click="triggerSaveModal('saveAs')" class="btn btn-outline text-[#4b5563] hover:text-[#1677ff] hover:bg-[#eff6ff]">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>另存为
            </button>
            <button @click="doExportPDF" class="btn btn-outline text-[#ea580c] hover:bg-[#fff7ed] bg-[#fff7ed]">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>导出模板标签
            </button>
            <button @click="triggerPdfImport" class="btn btn-outline text-[#8b5cf6] hover:bg-[#f5f3ff] bg-[#f5f3ff] flex items-center gap-1">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>合成PDF
            </button>
            <input type="file" ref="pdfInputRef" accept="application/pdf" class="hidden" @change="handleBatchPDF" />
            <div class="w-px h-6 bg-[#e5e7eb] mt-1.5 mx-1"></div>
            <button @click="triggerSaveModal('save')" class="btn bg-[#10b981] text-white hover:bg-[#059669] shadow-md border-transparent shadow-[#10b98133] px-6">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2-2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>保存
            </button>
            <button @click="closeEditor" class="btn btn-outline bg-[#f1f5f9] border-[#e5e7eb] text-[#6b7280] hover:text-[#1f2937] hover:bg-[#e2e8f0] px-4" title="关闭画板">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </header>

        <div class="flex flex-1 overflow-hidden relative">
          <ComponentLibrary @add-item="handleSidebarClickAdd" />

          <main class="flex-1 flex flex-col relative overflow-hidden bg-[#f3f4f6]">
            <div class="h-[58px] bg-white border-b border-[#e5e7eb] shrink-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-x-auto flex flex-nowrap items-center px-4 gap-2">
              <div class="flex flex-nowrap items-center gap-2 shrink-0">
                <button @click="openResizeModal" class="btn btn-outline text-xs h-8 px-3 hover:bg-[#eff6ff] hover:text-[#1677ff] shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>修改尺寸
                </button>
                <div class="w-px h-5 bg-[#d1d5db] mx-1 shrink-0"></div>
                <button @click="addText" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff] shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>添加文本
                </button>
                <button @click="triggerImageUpload" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff] shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>导入图片
                </button>
                <input type="file" ref="imageInputRef" accept="image/*" class="hidden" @change="handleImageUpload" />
                <button @click="addLine" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff] shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>添加线条
                </button>
                <div class="w-px h-5 bg-[#d1d5db] mx-1 shrink-0"></div>
                
                <button @click="resetBarcode" class="btn text-xs text-[#ea580c] bg-[#fff7ed] border border-transparent hover:bg-[#ffedd5] h-8 px-3 shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>复原条码
                </button>
                <button @click="showCustomBarcodeModal = true" class="btn text-xs text-[#ea580c] bg-[#fff7ed] border border-transparent hover:bg-[#ffedd5] h-8 px-3 shrink-0">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none"><path d="M3 5h2v14H3V5zm4 0h3v14H7V5zm5 0h2v14h-2V5zm4 0h3v14h-3V5zm5 0h2v14h-2V5z"/></svg>自定义条码
                </button>
              </div>

              <div class="ml-auto flex flex-nowrap items-center gap-2 shrink-0">
                <div v-if="activeElement" class="flex flex-nowrap items-center gap-1 shrink-0">
                  <div v-if="activeElement.type === 'text'" class="flex flex-nowrap items-center gap-1 bg-[#f1f5f9] border border-transparent rounded-lg px-1 h-8 shrink-0">
                    <span class="text-[11px] text-[#6b7280] font-bold px-1 shrink-0">字号</span>
                    <button @click="changeFontSize(-1)" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold text-[#4b5563] shrink-0">-</button>
                    <span class="text-[13px] font-mono w-6 text-center font-bold text-[#1677ff] shrink-0">{{ parseInt(activeElement.fontSize || '24') }}</span>
                    <button @click="changeFontSize(1)" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold text-[#4b5563] shrink-0">+</button>
                    <div class="w-px h-4 bg-[#cbd5e1] mx-1 shrink-0"></div>
                    <button @click="toggleBold" :class="{'bg-[#1677ff] text-white': activeElement.fontWeight === 'bold'}" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold transition-colors shrink-0">B</button>
                  </div>
                  
                  <div v-if="activeElement.type === 'line'" class="flex flex-nowrap items-center gap-1 bg-[#f1f5f9] border border-transparent rounded-lg px-1 h-8 shrink-0">
                    <span class="text-[11px] text-[#6b7280] font-bold px-1 shrink-0">长度</span>
                    <input type="number" :value="linePhysicalLength" @change="updateLineLength($event)" class="w-12 bg-white border border-[#d1d5db] rounded text-center font-mono text-[13px] text-[#1677ff] font-bold px-1 h-6 shrink-0" />
                    <span class="text-[10px] text-[#9ca3af] font-bold shrink-0">mm</span>
                    <div class="w-px h-4 bg-[#cbd5e1] mx-1 shrink-0"></div>
                    <button @click="rotateLine" class="px-2 h-6 hover:bg-[#e2e8f0] rounded-md text-[12px] font-bold text-[#374151] flex items-center gap-1 shrink-0"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>旋转</button>
                  </div>

                  <div class="w-px h-5 bg-[#e5e7eb] mx-2 shrink-0"></div>
                  
                  <button @click="deleteActive" class="btn text-xs text-[#ff4d4f] hover:bg-[#fef2f2] bg-[#fef2f2] border border-transparent h-8 flex items-center gap-1 px-3 shrink-0">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 删除
                  </button>
                </div>
              </div>
            </div>

            <CanvasArea 
              v-model:elements="currentLabel.elements"
              v-model:activeId="activeElementId"
              v-model:scale="canvasScale"
              :wMM="currentLabel.wMM"
              :hMM="currentLabel.hMM"
            />
          </main>
        </div>
      </div>
    </div>

    <div v-if="showNewModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">配置新标签尺寸</h3>
        </div>
        <div class="p-8 space-y-6">
          <div class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">画布宽度</span>
             <input v-model.number="newW" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
          <div class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">画布高度</span>
             <input v-model.number="newH" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showNewModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="confirmNewCanvas" class="w-full py-3 rounded-xl bg-[#1677ff] text-white font-bold hover:bg-[#4096ff] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">立即创建</button>
        </div>
      </div>
    </div>

    <div v-if="showResizeModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">修改画布尺寸</h3>
        </div>
        <div class="p-8 space-y-6">
          <div class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">新宽度</span>
             <input v-model.number="tempResizeW" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
          <div class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">新高度</span>
             <input v-model.number="tempResizeH" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showResizeModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="confirmResize" class="w-full py-3 rounded-xl bg-[#1677ff] text-white font-bold hover:bg-[#4096ff] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">确认修改</button>
        </div>
      </div>
    </div>

    <div v-if="showCustomBarcodeModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#fff7ed] border-b border-[#ffedd5]">
          <h3 class="font-extrabold text-[17px] text-[#ea580c] text-center tracking-wide">自定义条码尺寸</h3>
        </div>
        <div class="p-8 space-y-6">
          <div class="flex items-center gap-4 bg-[#fffbeb] border border-[#fed7aa] rounded-xl px-4 py-3 focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-[#ffedd5] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">条码宽度</span>
             <input v-model.number="customBarcodeW" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
          <div class="flex items-center gap-4 bg-[#fffbeb] border border-[#fed7aa] rounded-xl px-4 py-3 focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-[#ffedd5] focus-within:bg-white transition-all">
             <span class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">条码高度</span>
             <input v-model.number="customBarcodeH" type="number" min="10" class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center">
             <span class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span>
          </div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showCustomBarcodeModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="confirmCustomBarcode" class="w-full py-3 rounded-xl bg-[#ea580c] text-white font-bold hover:bg-[#f97316] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">插入条码</button>
        </div>
      </div>
    </div>

    <div v-if="showSaveModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">{{ saveActionType === 'saveAs' ? '另存为新副本' : (saveActionType === 'rename' ? '重命名' : '保存标签确认') }}</h3>
        </div>
        <div class="p-8">
          <div class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-4 focus-within:border-[#10b981] focus-within:ring-2 focus-within:ring-[#d1fae5] focus-within:bg-white transition-all">
             <input v-model="saveLabelName" type="text" placeholder="请输入标签名称" class="flex-1 w-full bg-transparent outline-none text-xl text-[#1f2937] text-center font-bold placeholder-[#9ca3af] placeholder:font-normal">
          </div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showSaveModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="confirmSaveLabel(false)" class="w-full py-3 rounded-xl bg-[#10b981] text-white font-bold hover:bg-[#059669] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">确认保存</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col text-center">
        <div class="p-8">
          <div class="w-16 h-16 bg-[#fef2f2] text-[#ff4d4f] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
          </div>
          <h3 class="text-xl font-extrabold text-[#1f2937] mb-2">永久删除标签？</h3>
          <p class="text-sm text-[#6b7280] font-medium">删除后数据将无法恢复，请谨慎操作。</p>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showDeleteModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="confirmDeleteLabel" class="w-full py-3 rounded-xl bg-[#ff4d4f] text-white font-bold hover:bg-[#dc2626] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">确认删除</button>
        </div>
      </div>
    </div>

    <div v-if="showImportShareModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">提取分享标签</h3>
        </div>
        <div class="p-8">
          <input v-model="inputShareCode" type="text" placeholder="输入6位分享码" maxlength="6" class="w-full uppercase font-mono tracking-[8px] text-center text-3xl px-4 py-5 bg-[#f8fafc] border border-[#d1d5db] rounded-xl outline-none focus:border-[#1677ff] focus:bg-white transition-colors text-[#1677ff] placeholder-[#cbd5e1] placeholder:tracking-normal placeholder:text-lg">
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showImportShareModal = false" class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold hover:bg-[#cbd5e1] transition-colors text-[15px] border-none cursor-pointer outline-none">取消</button>
          <button @click="downloadLabelFromCloud" class="w-full py-3 rounded-xl bg-[#1677ff] text-white font-bold hover:bg-[#4096ff] shadow-md transition-all text-[15px] border-none cursor-pointer outline-none">立即提取</button>
        </div>
      </div>
    </div>

    <div v-if="showShareResultModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden text-center">
        <div class="px-6 py-5 bg-[#eff6ff] border-b border-[#dbeafe] font-extrabold text-[17px] text-[#1677ff] tracking-wide">云端生成成功</div>
        <div class="p-8">
          <p class="text-[15px] text-[#6b7280] mb-6 font-bold">您的专属提取码 (有效期7天)</p>
          <div class="text-5xl font-black font-mono text-[#1677ff] tracking-[8px] bg-[#eff6ff] py-6 rounded-xl border-2 border-dashed border-[#bfdbfe] shadow-inner select-all cursor-text">
            {{ displayShareCode }}
          </div>
          <p class="text-sm text-[#10b981] font-bold mt-6 flex items-center justify-center gap-1.5 bg-[#ecfdf5] py-2 rounded-lg">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            已自动复制到剪贴板
          </p>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] flex">
          <button @click="showShareResultModal = false" class="btn bg-[#1677ff] text-white w-full py-3.5 text-[15px] shadow-md border-none cursor-pointer outline-none">完成</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ComponentLibrary from './components/ComponentLibrary.vue';
import CanvasArea from './components/CanvasArea.vue';
import LabelThumbnail from './components/LabelThumbnail.vue'; 
import { getAllLabels, saveLabel, deleteLabel, clearAndImportDB } from './utils/db';
import { exportSinglePDF, exportBatchPDF } from './utils/pdfExport';
import { cropImageWhitespace } from './utils/imageCrop';
import type { LabelData } from './types';

const API_BASE_URL = 'https://easylabel.cloud/api/share';
const MM_TO_PX = 3.78; 
const ZOOM_FACTOR = 2;

const currentView = ref<'dashboard' | 'editor'>('dashboard');
const showEditor = computed({ get: () => currentView.value === 'editor', set: (v) => currentView.value = v ? 'editor' : 'dashboard' });

const savedLabels = ref<LabelData[]>([]);
const currentLabel = ref<LabelData>({ id: '', name: '', wMM: 100, hMM: 100, elements: [] });
const activeElementId = ref<string | null>(null);
const canvasScale = ref(1);
let elementZIndex = 10;

const isLoading = ref(false);
const loadingText = ref('处理中...');
const loadingProgress = ref<number | null>(null); 

const showSaveModal = ref(false);
const saveActionType = ref<'save' | 'saveAs' | 'rename'>('save');
const saveLabelName = ref('');
const showDeleteModal = ref(false);
const deleteTargetId = ref('');

const showNewModal = ref(false);
const showResizeModal = ref(false);
const showCustomBarcodeModal = ref(false);
const showImportShareModal = ref(false);
const showShareResultModal = ref(false);

const inputShareCode = ref('');
const displayShareCode = ref('');

const newW = ref(100);
const newH = ref(100);
const tempResizeW = ref(100);
const tempResizeH = ref(100);
const customBarcodeW = ref(70);
const customBarcodeH = ref(20);

const jsonInputRef = ref<HTMLInputElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const pdfInputRef = ref<HTMLInputElement | null>(null);

const activeElement = computed(() => currentLabel.value.elements.find(el => el.id === activeElementId.value));

onMounted(async () => {
  await reloadGallery();
  document.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('resize', autoFitCanvas);
  
  window.showToast = function(message: string, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    let icon = ''; let colorClass = '';
    if(type === 'success') { icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`; colorClass = 'border-l-[#10b981] text-[#10b981] bg-white'; }
    else if(type === 'error') { icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`; colorClass = 'border-l-[#ff4d4f] text-[#ff4d4f] bg-white'; }
    else if(type === 'warning') { icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`; colorClass = 'border-l-[#ea580c] text-[#ea580c] bg-white'; }
    else { icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`; colorClass = 'border-l-[#1677ff] text-[#1677ff] bg-white'; }
    
    toast.className = `backdrop-blur-md px-5 py-3.5 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-[#e5e7eb] border-l-[5px] ${colorClass} flex items-center gap-3 transform transition-all duration-300 translate-x-[120%] opacity-0 z-[9999]`;
    toast.innerHTML = `<div class="w-5 h-5 shrink-0">${icon}</div><span class="font-bold text-[#1f2937] text-[14px] tracking-wide">${message}</span>`;
    container.appendChild(toast);
    
    requestAnimationFrame(() => { toast.classList.remove('translate-x-[120%]', 'opacity-0'); });
    setTimeout(() => { toast.classList.add('translate-x-[120%]', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
  };
});

onUnmounted(() => { document.removeEventListener('keydown', handleGlobalKeydown); window.removeEventListener('resize', autoFitCanvas); });

function showToast(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') { if (window.showToast) window.showToast(message, type); }

function autoFitCanvas() {
  if (currentView.value !== 'editor') return;
  setTimeout(() => {
    const workspace = document.getElementById('workspace-container');
    if (!workspace) return;
    const availableW = workspace.clientWidth - 200;
    const availableH = workspace.clientHeight - 200;
    const targetW = currentLabel.value.wMM * MM_TO_PX * ZOOM_FACTOR;
    const targetH = currentLabel.value.hMM * MM_TO_PX * ZOOM_FACTOR;
    let scale = Math.min(availableW / targetW, availableH / targetH);
    canvasScale.value = Math.max(0.2, Math.min(scale, 3));
  }, 50);
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (currentView.value !== 'editor' || !activeElement.value) return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { deleteActive(); e.preventDefault(); return; }
  const stepPx = e.shiftKey ? 10 : 1; 
  let left = parseFloat(activeElement.value.style.left); let top = parseFloat(activeElement.value.style.top); let moved = false;
  switch(e.key) { case 'ArrowUp': top -= stepPx; moved = true; break; case 'ArrowDown': top += stepPx; moved = true; break; case 'ArrowLeft': left -= stepPx; moved = true; break; case 'ArrowRight': left += stepPx; moved = true; break; }
  if (moved) { e.preventDefault(); activeElement.value.style.left = `${Math.max(0, left)}px`; activeElement.value.style.top = `${Math.max(0, top)}px`; }
}

function refreshPage() { window.location.reload(); }

async function reloadGallery() {
  const wasLoading = isLoading.value;
  if (!wasLoading) {
    isLoading.value = true; 
    loadingText.value = '加载本地数据库...';
  }
  
  try {
    const labels = await getAllLabels();
    savedLabels.value = labels.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  } catch (error) {
    savedLabels.value = [];
    showToast('加载数据库失败，已清空', 'warning');
  } finally {
    if (!wasLoading) {
      isLoading.value = false;
    }
  }
}

function getBarcodeDefaultStyle(hMM: number) {
  const wPx = 70 * MM_TO_PX * ZOOM_FACTOR; const hPx = 20 * MM_TO_PX * ZOOM_FACTOR; const canvasHPx = hMM * MM_TO_PX * ZOOM_FACTOR; const topPx = Math.max(0, canvasHPx - hPx);
  return { width: `${wPx}px`, height: `${hPx}px`, left: '0px', top: `${topPx}px`, zIndex: 10 };
}

function openEditor(label: LabelData | null) {
  if (label) { currentLabel.value = JSON.parse(JSON.stringify(label)); const maxZ = Math.max(0, ...currentLabel.value.elements.map(el => Number(el.style.zIndex) || 0)); elementZIndex = maxZ + 10; }
  activeElementId.value = null; showEditor.value = true; autoFitCanvas();
}

// ★ 修复：只要有一边小于占位条码标准（w<70 或 h<20），就直接跳过条码生成
function confirmNewCanvas() {
  if (!newW.value || !newH.value) return showToast('请输入完整尺寸', 'warning');
  currentLabel.value = { id: Date.now().toString(), name: '新建标签', wMM: newW.value, hMM: newH.value, elements: [] };
  if (newW.value >= 70 && newH.value >= 20) { currentLabel.value.elements.push({ id: Date.now().toString() + '_bc', type: 'barcode', style: getBarcodeDefaultStyle(newH.value) }); }
  showNewModal.value = false; openEditor(null); 
}

function openResizeModal() { tempResizeW.value = currentLabel.value.wMM; tempResizeH.value = currentLabel.value.hMM; showResizeModal.value = true; }
function confirmResize() {
  if (!tempResizeW.value || !tempResizeH.value) return showToast('请输入完整尺寸', 'warning');
  currentLabel.value.wMM = tempResizeW.value; currentLabel.value.hMM = tempResizeH.value;
  showResizeModal.value = false; autoFitCanvas(); showToast('尺寸已修改生效', 'success');
}

function triggerRenameModal(label: LabelData) { 
  saveLabelName.value = label.name; 
  saveActionType.value = 'rename'; 
  currentLabel.value = JSON.parse(JSON.stringify(label)); 
  showSaveModal.value = true; 
}

function triggerDeleteModal(id: string) { deleteTargetId.value = id; showDeleteModal.value = true; }
async function confirmDeleteLabel() { await deleteLabel(deleteTargetId.value); await reloadGallery(); showDeleteModal.value = false; showToast('已永久删除', 'success'); }

function triggerSaveModal(type: 'save' | 'saveAs') {
  saveActionType.value = type;
  if (type === 'save' && currentLabel.value.name !== '新建标签' && currentLabel.value.name.trim() !== '') { 
    confirmSaveLabel(true); 
    return; 
  }
  saveLabelName.value = type === 'saveAs' ? (currentLabel.value.name === '新建标签' ? '未命名标签' : currentLabel.value.name) + ' - 副本' : (currentLabel.value.name === '新建标签' ? '未命名标签' : currentLabel.value.name);
  showSaveModal.value = true;
}

async function confirmSaveLabel(directSave = false) {
  if (!directSave && !saveLabelName.value.trim()) return showToast('请输入标签名称', 'warning');
  if (!directSave) showSaveModal.value = false;
  
  isLoading.value = true; loadingText.value = '保存中...'; activeElementId.value = null; 
  
  try {
    if (saveActionType.value === 'saveAs') {
      const newLabel = JSON.parse(JSON.stringify(currentLabel.value)); newLabel.id = Date.now().toString(); newLabel.name = saveLabelName.value.trim();
      await saveLabel(newLabel); currentLabel.value = newLabel; showToast('已存为新副本！', 'success');
    } else {
      if (!directSave) currentLabel.value.name = saveLabelName.value.trim(); 
      await saveLabel(JSON.parse(JSON.stringify(currentLabel.value))); showToast('保存成功', 'success');
    }
    await reloadGallery(); 
    showEditor.value = false; 
  } catch(e) {
    showToast('保存失败', 'error');
  } finally {
    isLoading.value = false; 
  }
}

async function handleSidebarClickAdd(payload: any) {
  let finalImgUrl = payload.imgUrl;
  let finalW = payload.type === 'text' ? 200 : 80;
  let finalH = 80;
  
  if (payload.type === 'image' && finalImgUrl) {
    const cropResult = await cropImageWhitespace(finalImgUrl); 
    finalImgUrl = cropResult.url;
    finalH = Math.round(80 * (cropResult.height / cropResult.width));
  }
  
  const canvasW = currentLabel.value.wMM * MM_TO_PX * ZOOM_FACTOR; const canvasH = currentLabel.value.hMM * MM_TO_PX * ZOOM_FACTOR;
  currentLabel.value.elements.push({
    id: Date.now().toString(), type: payload.type, content: payload.content, imgUrl: finalImgUrl, originalUrl: payload.imgUrl, fontSize: '24px', fontWeight: 'normal',
    style: { width: `${finalW}px`, height: payload.type === 'text' ? 'auto' : `${finalH}px`, left: `${(canvasW - finalW) / 2}px`, top: `${(canvasH - (payload.type === 'text' ? 30 : finalH)) / 2}px`, zIndex: elementZIndex++ }
  });
}

function triggerJsonImport() { jsonInputRef.value?.click(); }
function handleJsonImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try { const data = JSON.parse(ev.target?.result as string); if (Array.isArray(data)) { isLoading.value = true; loadingText.value = '恢复数据中...'; await clearAndImportDB(data); await reloadGallery(); showToast('导入成功', 'success'); } } catch(err) { showToast('文件格式错误！', 'error'); } finally { if (jsonInputRef.value) jsonInputRef.value.value = ''; }
  };
  reader.readAsText(file);
}
async function exportJsonLibrary() {
  if (savedLabels.value.length === 0) return showToast('没有数据可导出', 'warning');
  isLoading.value = true; loadingText.value = '打包数据中...';
  const fullData = await getAllLabels(); const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData)); const a = document.createElement('a'); a.href = dataStr; a.download = "易标签_本地库备份.json"; a.click();
  isLoading.value = false; showToast('导出成功', 'success');
}

function closeEditor() { activeElementId.value = null; showEditor.value = false; reloadGallery(); }

function addText() { currentLabel.value.elements.push({ id: Date.now().toString(), type: 'text', content: '双击修改文本', fontSize: '24px', fontWeight: 'normal', style: { width: '200px', height: 'auto', left: '20px', top: '20px', zIndex: elementZIndex++ } }); }
function resetBarcode() { const barcode = currentLabel.value.elements.find(el => el.type === 'barcode'); if (barcode) barcode.style = getBarcodeDefaultStyle(currentLabel.value.hMM); else currentLabel.value.elements.push({ id: Date.now().toString(), type: 'barcode', style: getBarcodeDefaultStyle(currentLabel.value.hMM) }); }
function confirmCustomBarcode() {
  if (!customBarcodeW.value || !customBarcodeH.value) return showToast('请输入完整尺寸', 'warning');
  let wPx = customBarcodeW.value * MM_TO_PX * ZOOM_FACTOR; let hPx = customBarcodeH.value * MM_TO_PX * ZOOM_FACTOR; 
  currentLabel.value.elements.push({ id: Date.now().toString(), type: 'barcode', style: { width: `${wPx}px`, height: `${hPx}px`, left: '10px', top: '10px', zIndex: elementZIndex++ } });
  showCustomBarcodeModal.value = false;
}
function addLine() { currentLabel.value.elements.push({ id: Date.now().toString(), type: 'line', isVertical: 'false', style: { width: '150px', height: `${0.2 * MM_TO_PX * ZOOM_FACTOR}px`, left: '20px', top: '20px', zIndex: elementZIndex++ } }); }

function triggerImageUpload() { imageInputRef.value?.click(); }
function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => { 
    const dataUrl = ev.target?.result as string;
    const cropResult = await cropImageWhitespace(dataUrl);
    const finalH = Math.round(80 * (cropResult.height / cropResult.width));
    currentLabel.value.elements.push({ id: Date.now().toString(), type: 'image', imgUrl: cropResult.url, originalUrl: dataUrl, style: { width: '80px', height: `${finalH}px`, left: '20px', top: '20px', zIndex: elementZIndex++ } }); 
    if (imageInputRef.value) imageInputRef.value.value = ''; 
  };
  reader.readAsDataURL(file);
}

function deleteActive() { if (activeElementId.value) { currentLabel.value.elements = currentLabel.value.elements.filter(el => el.id !== activeElementId.value); activeElementId.value = null; } }

function changeFontSize(delta: number) { if(activeElement.value && activeElement.value.type === 'text') { let currentSize = parseInt(activeElement.value.fontSize || '24'); activeElement.value.fontSize = `${Math.max(10, currentSize + delta * 2)}px`; } }
function toggleBold() { if(activeElement.value && activeElement.value.type === 'text') { activeElement.value.fontWeight = activeElement.value.fontWeight === 'bold' ? 'normal' : 'bold'; } }

const linePhysicalLength = computed(() => {
  if (!activeElement.value || activeElement.value.type !== 'line') return 0;
  const isVert = activeElement.value.isVertical === 'true';
  const px = parseFloat(isVert ? activeElement.value.style.height : activeElement.value.style.width);
  return Math.round(px / (MM_TO_PX * ZOOM_FACTOR));
});

function updateLineLength(e: Event) {
   const val = parseFloat((e.target as HTMLInputElement).value);
   if (val && activeElement.value) {
     const newPx = val * MM_TO_PX * ZOOM_FACTOR;
     if (activeElement.value.isVertical === 'true') { activeElement.value.style.height = `${newPx}px`; } else { activeElement.value.style.width = `${newPx}px`; }
   }
}

function rotateLine() {
  if(activeElement.value && activeElement.value.type === 'line') {
    const isVert = activeElement.value.isVertical === 'true';
    const oldW = activeElement.value.style.width; const oldH = activeElement.value.style.height;
    activeElement.value.style.width = oldH; activeElement.value.style.height = oldW;
    activeElement.value.isVertical = isVert ? 'false' : 'true';
  }
}

async function doExportPDF() {
  activeElementId.value = null; isLoading.value = true; loadingText.value = '生成模板标签中...';
  setTimeout(async () => {
    try {
      const canvasEl = document.getElementById('canvas'); const sizerEl = document.getElementById('canvasSizer');
      if(canvasEl && sizerEl) { await exportSinglePDF(canvasEl, sizerEl, currentLabel.value.wMM, currentLabel.value.hMM, currentLabel.value.name || '导出文件'); showToast('导出成功', 'success'); }
    } catch(err) { showToast('导出失败', 'error'); } finally { isLoading.value = false; }
  }, 150);
}
function triggerPdfImport() {
  const barcodeEl = currentLabel.value.elements.find(el => el.type === 'barcode');
  if (!barcodeEl) return showToast('请先新增条码进行占位', 'warning');
  pdfInputRef.value?.click();
}

// ★ 修复：通过在 JS 层直接读取 files[0] 保证 100% 只处理一个文件
async function handleBatchPDF(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0]; 
  if (!file) return;
  if (file.type !== 'application/pdf') { showToast('只能上传 PDF 文件！', 'warning'); return; }
  const barcodeEl = currentLabel.value.elements.find(el => el.type === 'barcode'); if (!barcodeEl) return;
  activeElementId.value = null; loadingProgress.value = 0; isLoading.value = true; loadingText.value = '极速合成中...';
  setTimeout(async () => {
    try {
      const canvasEl = document.getElementById('canvas'); const sizerEl = document.getElementById('canvasSizer');
      if(canvasEl && sizerEl) {
        await exportBatchPDF(file, canvasEl, sizerEl, currentLabel.value.wMM, currentLabel.value.hMM, currentLabel.value.name || '导出文件', barcodeEl,
          (percent, current, total) => { loadingProgress.value = percent; loadingText.value = `正在合成 (${current}/${total})...`; }
        );
        showToast('合成完成！', 'success');
      }
    } catch(err: any) { 
      showToast(err.message || '合成失败', 'error'); 
    } finally { 
      isLoading.value = false; 
      loadingProgress.value = null; 
      if (pdfInputRef.value) pdfInputRef.value.value = ''; 
    }
  }, 150);
}

// ★ 修复：加入 AbortController 防国内 DNS 污染造成的无限卡顿 ★
async function uploadLabelToCloud(labelData: LabelData) {
  isLoading.value = true; loadingText.value = '生成云端分享码...';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时强制熔断
  try {
    const response = await fetch(API_BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(labelData), signal: controller.signal });
    const result = await response.json(); 
    if(!response.ok) throw new Error(result.error); 
    displayShareCode.value = result.shareCode; showShareResultModal.value = true;
    try { await navigator.clipboard.writeText(result.shareCode); } catch(e){}
  } catch (e: any) { 
    if (e.name === 'AbortError') {
       showToast('国内网络超时，请阅读下方自定义域名教程', 'error');
    } else {
       showToast('网络请求失败', 'error'); 
    }
  } finally { clearTimeout(timeoutId); isLoading.value = false; }
}

async function downloadLabelFromCloud() {
    if (inputShareCode.value.length !== 6) return showToast('请输入完整的6位分享码', 'warning');
  isLoading.value = true; loadingText.value = '云端检索中...';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/${inputShareCode.value.toUpperCase()}`, { signal: controller.signal });
    const result = await response.json(); 
    if (!response.ok) throw new Error(result.error || '分享码无效'); 
    const labelData = result.labelData as LabelData;
    labelData.id = Date.now().toString(); 
    let baseName = labelData.name.replace(/ \(分享\d*\)$/, ''); 
    let finalName = baseName; let counter = 1;
    while (savedLabels.value.some(l => l.name === finalName)) { finalName = `${baseName} (分享${counter})`; counter++; }
    labelData.name = finalName;
    await saveLabel(labelData); await reloadGallery();
    showImportShareModal.value = false; inputShareCode.value = '';
    showToast('提取成功！已存入本地库', 'success');
  } catch(e: any) { 
    if (e.name === 'AbortError') {
       showToast('国内网络超时，请阅读下方自定义域名教程', 'error');
    } else {
       showToast(e.message || '提取失败', 'error'); 
    }
  } finally { clearTimeout(timeoutId); isLoading.value = false; }
}

declare global { interface Window { showToast: (msg: string, type?: 'info'|'success'|'warning'|'error') => void; } }
</script>

<style scoped>
@reference "tailwindcss";

.btn { @apply flex items-center justify-center gap-1.5 border-none rounded-lg cursor-pointer font-bold transition-all whitespace-nowrap; }
.btn-outline { @apply bg-[#f1f5f9] border border-transparent text-[#475569] hover:text-[#1677ff] hover:bg-[#e0f2fe] px-4 py-2.5 text-[13px] shadow-sm; }
</style>