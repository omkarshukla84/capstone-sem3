# Adaptrix – The JavaScript Marketplace for LoRA Adapters

Adaptrix is a full-stack ecosystem designed to bring LoRA (Low-Rank Adaptation) adapters into the JavaScript world.
It provides a local-first marketplace, CLI tool, and npm SDK that developers can use to publish, discover, download, and integrate adapters into any JavaScript or Node.js project.

This repository currently includes the authentication system using JWT, with more features under development.

## Project Vision

LoRA adapters are becoming the standard method of fine‑tuning large models efficiently.
However, the JavaScript ecosystem lacks:

- A unified place to publish adapters  
- A searchable discovery engine  
- A simple CLI installer  
- A native JS SDK for applying adapters locally  

Adaptrix fills this gap by becoming the npm-like marketplace for AI adapters.

## System Architecture

Frontend: Next.js + React  
Backend: Node.js + Express  
Database: Supabase Postgres  
Storage: Supabase Buckets  
Auth: Supabase JWT Auth  
CLI Tool: adaptrix-cli  
npm SDK: adaptrix-js  

### Architecture Flow

1. Developers upload LoRA adapters with metadata.
2. Metadata is stored in Supabase.
3. Adapter files go into Supabase Buckets.
4. Users browse adapters via the frontend.
5. Developers install adapters using the CLI or SDK.

## Features (Planned)

- Upload LoRA adapters  
- Adapter search & filtering  
- CLI tool  
- npm SDK  
- Versioning system  
- JWT Authentication (implemented)  

## API Overview (Planned Routes)

| Endpoint | Method | Description | Access |
|---------|--------|-------------|--------|
| /api/adapters | GET | Fetch all or filtered adapters | Public |
| /api/adapters/:id | GET | Fetch adapter details | Public |
| /api/adapters | POST | Upload adapter | Authenticated |
| /api/adapters/:id/download | GET | Download adapter | Public |
| /api/auth/login | POST | JWT login | Public |
| /api/cli/:adapterId | GET | Fetch adapter for CLI | Public |

## CLI Tool Example (Future)

```bash
npm i -g adaptrix-cli
adaptrix list --model qwen-1.5b
adaptrix install adapter_id
```

## npm SDK Example (Future)

```javascript
import { loadAdapter } from "adaptrix-js";
const adapter = await loadAdapter("adapter_id", { model: "qwen-1.5b" });
model.applyLoRA(adapter);
```

## Future Scope

- Adapter benchmarking  
- Dataset transparency  
- Community ratings  
- Hybrid LoRA adapters  
- Local benchmarking suite  

## Current Status

✔ JWT Authentication Implemented  
⬜ Adapter Upload  
⬜ Marketplace Frontend  
⬜ CLI Tool  
⬜ npm SDK  
⬜ Versioning System  

## License

MIT License.
