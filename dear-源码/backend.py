import json
from pathlib import Path
from aiohttp import web

DATA = Path.home() / "dear" / "data"
DATA.mkdir(parents=True, exist_ok=True)

def load(name, default):
    p = DATA / name
    if not p.exists():
        p.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except:
        return default

def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

load("soul.json", {"content": ""})
load("memories.json", [])
load("diary.json", [])
load("skills.json", {"search": True})
load("conversations.json", [])
load("mcp.json", {"servers": []})
load("calendar.json", [])
load("period.json", [])
load("memories_pending.json", [])
load("heartbeat.json", {"interval_minutes": 0})

@web.middleware
async def cors_mw(request, handler):
    if request.method == "OPTIONS":
        return web.Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        })
    resp = await handler(request)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp

routes = web.RouteTableDef()

@routes.get("/health")
async def health(req): return web.json_response({"status":"ok","service":"dear-backend"})

@routes.get("/soul")
async def get_soul(req): return web.json_response(load("soul.json", {"content":""}))
@routes.put("/soul")
async def put_soul(req):
    data = await req.json()
    content = data.get("content","") if isinstance(data, dict) else str(data)
    save("soul.json", {"content": content})
    return web.json_response({"ok": True})

@routes.get("/memories")
async def get_mems(req): return web.json_response(load("memories.json", []))
@routes.post("/memories")
async def post_mems(req):
    data = await req.json()
    lst = load("memories.json", [])
    lst.append(data); save("memories.json", lst)
    return web.json_response({"ok": True})
@routes.delete("/memories/{t}")
async def del_mems(req):
    t = req.match_info["t"]
    lst = [x for x in load("memories.json", []) if str(x.get("t")) != t]
    save("memories.json", lst); return web.json_response({"ok": True})

@routes.get("/diary")
async def get_diary(req): return web.json_response(load("diary.json", []))
@routes.post("/diary")
async def post_diary(req):
    data = await req.json()
    lst = load("diary.json", [])
    lst.append(data); save("diary.json", lst)
    return web.json_response({"ok": True})

@routes.get("/skills")
async def get_skills(req): return web.json_response(load("skills.json", {"search": True}))
@routes.put("/skills")
async def put_skills(req):
    data = await req.json(); save("skills.json", data)
    return web.json_response({"ok": True})

@routes.get("/mcp")
async def get_mcp(req): return web.json_response(load("mcp.json", {"servers": []}))
@routes.put("/mcp")
async def put_mcp(req):
    data = await req.json(); save("mcp.json", data)
    return web.json_response({"ok": True})

@routes.get("/memories/pending")
async def get_pending(req): return web.json_response(load("memories_pending.json", []))
@routes.post("/memories/pending")
async def post_pending(req):
    data = await req.json(); lst = load("memories_pending.json", []); lst.append(data); save("memories_pending.json", lst); return web.json_response({"ok": True})
@routes.delete("/memories/pending/{t}")
async def del_pending(req):
    t = req.match_info["t"]; lst = [x for x in load("memories_pending.json", []) if str(x.get("t")) != t]; save("memories_pending.json", lst); return web.json_response({"ok": True})
@routes.put("/memories/pending/{t}")
async def put_pending(req):
    t = req.match_info["t"]; data = await req.json(); lst = load("memories_pending.json", []);
    for i,x in enumerate(lst):
        if str(x.get("t"))==t: lst[i]=data; break
    save("memories_pending.json", lst); return web.json_response({"ok": True})

@routes.get("/conversations")
async def get_convs(req): return web.json_response(load("conversations.json", []))
@routes.post("/conversations")
async def post_convs(req):
    data = await req.json()
    lst = load("conversations.json", [])
    for i,c in enumerate(lst):
        if c.get("id")==data.get("id"): lst[i]=data; break
    else: lst.append(data)
    save("conversations.json", lst); return web.json_response({"ok": True})
@routes.delete("/conversations/{cid}")
async def del_convs(req):
    cid=req.match_info["cid"]
    lst=[x for x in load("conversations.json",[]) if str(x.get("id"))!=cid]
    save("conversations.json", lst); return web.json_response({"ok": True})

@routes.post("/heartbeat")
async def hb(req):
    data = await req.json() if req.can_read_body else {}
    save("heartbeat.json", data); return web.json_response({"ok": True})

@routes.get("/calendar")
async def get_cal(req): return web.json_response(load("calendar.json", []))
@routes.put("/calendar")
async def put_cal(req):
    data = await req.json(); save("calendar.json", data); return web.json_response({"ok": True})

@routes.get("/period")
async def get_period(req): return web.json_response(load("period.json", []))
@routes.put("/period")
async def put_period(req):
    data = await req.json(); save("period.json", data); return web.json_response({"ok": True})

@routes.get("/system")
async def get_system(req):
    import time
    return web.json_response({"ok": True, "service": "dear-backend", "time": time.time()})

@routes.get("/store/{key}")
async def get_store(req):
    k = req.match_info["key"]; return web.json_response(load(f"store_{k}.json", {}))
@routes.put("/store/{key}")
async def put_store(req):
    k = req.match_info["key"]; data = await req.json(); save(f"store_{k}.json", data); return web.json_response({"ok": True})
@routes.get("/")
async def root(req): return web.FileResponse(str((DATA.parent / "DEAR.html").resolve()))
@routes.get("/DEAR.html")
async def dear_html(req): return web.FileResponse(str((DATA.parent / "DEAR.html").resolve()))
@routes.get("/stealth")
async def stealth(req): return web.FileResponse(str((DATA.parent / "DEAR_stealth.html").resolve()))
@routes.get("/DEAR_stealth.html")
async def stealth2(req): return web.FileResponse(str((DATA.parent / "DEAR_stealth.html").resolve()))

app = web.Application(middlewares=[cors_mw])
app.add_routes(routes)
if __name__ == "__main__":
    web.run_app(app, host="0.0.0.0", port=8643)
