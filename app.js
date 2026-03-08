const SUPABASE_URL="https://xoinvyrxuqkfijindstp.supabase.co"
const SUPABASE_KEY="sb_publishable__rtGNRVn0dhwAE1Q0PIy6Q_L0fsxm3N"
const { createClient } = supabase
const db = createClient(SUPABASE_URL,SUPABASE_KEY)

let deleteTarget = null

function openCreateModal(){
    document.getElementById("create-modal").classList.remove("hidden")
}

function closeCreateModal(){
    const modal = document.getElementById("create-modal")
    modal.classList.add("hidden")
    document.getElementById("name").value = ""
    document.getElementById("url").value = ""
}

async function createQR(){
    const name = document.getElementById("name").value
    const url = document.getElementById("url").value
    if(!name || !url) return alert("이름과 URL을 입력하세요")
    await db.from("qrs").insert([{name,url}])
    closeCreateModal()
    loadQR()
}

async function loadQR(){
    const sort = document.getElementById("sort").value
    const search = document.getElementById("search").value.toLowerCase()

    let query = db.from("qrs").select("*")
    if(sort==="new") query=query.order("created_at",{ascending:false})
    if(sort==="old") query=query.order("created_at",{ascending:true})
    if(sort==="scan") query=query.order("scan_count",{ascending:false})

    const {data} = await query
    if(!data) return

    const list = document.getElementById("qr-list")
    list.innerHTML=""

    data
    .filter(item=>{
        if(!search) return true
        return item.name?.toLowerCase().includes(search)
            || item.url?.toLowerCase().includes(search)
    })
    .forEach(item=>{
        const bar = document.createElement("div")
        bar.className = "qr-bar"

        // QR
        const qrDiv = document.createElement("div")
        qrDiv.className="qr-small"
        new QRCode(qrDiv,{
            text:`http://jwqr.kro.kr/r.html?id=${item.id}`,
            width:70,
            height:70
        })
        qrDiv.onclick = ()=> showQR(item)

        // QR info
        const infoDiv = document.createElement("div")
        infoDiv.className="qr-info"

        // 이름
        const nameDiv = document.createElement("div")
        nameDiv.className="qr-name"
        nameDiv.dataset.id = item.id
        const nameSpan = document.createElement("span")
        nameSpan.className="name-text"
        nameSpan.innerText = item.name

        // pencil wrapper
        const pencilWrapper = document.createElement("span")
        pencilWrapper.style.cursor = "pointer"
        pencilWrapper.onclick = () => editName(item.id)
        const pencil = document.createElement("i")
        pencil.setAttribute("data-lucide","pencil")
        pencilWrapper.appendChild(pencil)

        nameDiv.appendChild(nameSpan)
        nameDiv.appendChild(pencilWrapper)

        // 생성일
        const createdDiv = document.createElement("div")
        createdDiv.innerText = new Date(item.created_at).toLocaleDateString()

        // URL
        const urlDiv = document.createElement("div")
        const urlA = document.createElement("a")
        urlA.className="url-link"
        urlA.href = item.url
        urlA.target="_blank"
        urlA.innerText = item.url
        urlDiv.appendChild(urlA)

        infoDiv.appendChild(nameDiv)
        infoDiv.appendChild(createdDiv)
        infoDiv.appendChild(urlDiv)

        // 스캔
        const scanDiv = document.createElement("div")
        scanDiv.className="scan"
        const scanLabel = document.createElement("span")
        scanLabel.className="scan-label"
        scanLabel.innerText="스캔"
        const scanCount = document.createElement("span")
        scanCount.className="scan-count"
        scanCount.innerText=item.scan_count||0
        scanDiv.appendChild(scanLabel)
        scanDiv.appendChild(scanCount)

        // actions
        const actionDiv = document.createElement("div")
        actionDiv.className="actions"
        const trashWrapper = document.createElement("span")
        trashWrapper.style.cursor = "pointer"
        trashWrapper.onclick = () => openDelete(item.id)
        const trash = document.createElement("i")
        trash.setAttribute("data-lucide","trash-2")
        trashWrapper.appendChild(trash)
        actionDiv.appendChild(trashWrapper)

        bar.appendChild(qrDiv)
        bar.appendChild(infoDiv)
        bar.appendChild(scanDiv)
        bar.appendChild(actionDiv)

        list.appendChild(bar)
    })

    lucide.createIcons()
}

function showQR(item){
    const modal = document.createElement("div")
    modal.className = "modal"

    const box = document.createElement("div")
    box.className = "modal-box"

    const qr = document.createElement("div")
    new QRCode(qr,{
        text:`http://jwqr.kro.kr/r.html?id=${item.id}`,
        width:260,
        height:260
    })

    const downloadBtn = document.createElement("button")
    downloadBtn.innerText="다운로드"
    downloadBtn.className="download-btn"
    downloadBtn.onclick = (e)=>{
        e.stopPropagation()
        const canvas = qr.querySelector("canvas")
        if(!canvas) return
        const link = document.createElement("a")
        link.download="qr.png"
        link.href=canvas.toDataURL()
        link.click()
    }

    box.appendChild(qr)
    box.appendChild(downloadBtn)
    modal.appendChild(box)
    modal.onclick = ()=> modal.remove()
    document.body.appendChild(modal)
}

function editName(id){
    const box=document.querySelector(`[data-id="${id}"]`)
    const span=box.querySelector(".name-text")
    const old=span.innerText

    const input = document.createElement("input")
    input.className="name-input"
    input.value = old
    input.onblur = ()=> saveName(id,input)
    box.innerHTML=""
    box.appendChild(input)
    input.focus()
}

async function saveName(id,input){
    const name=input.value
    await db.from("qrs").update({name}).eq("id",id)
    loadQR()
}

function openDelete(id){
    deleteTarget=id
    document.getElementById("delete-modal").classList.remove("hidden")
}

function closeDelete(){
    document.getElementById("delete-modal").classList.add("hidden")
}

document.getElementById("delete-confirm").onclick=async ()=>{
    if(!deleteTarget) return
    await db.from("qrs").delete().eq("id",deleteTarget)
    deleteTarget=null
    closeDelete()
    loadQR()
}

document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
        document.getElementById("create-modal").classList.add("hidden")
        document.getElementById("delete-modal").classList.add("hidden")
        document.getElementById("name").value=""
        document.getElementById("url").value=""
        document.querySelectorAll(".modal").forEach(m=>{if(!m.id) m.remove()})
    }
})

document.getElementById("search").addEventListener("input",loadQR)

loadQR()