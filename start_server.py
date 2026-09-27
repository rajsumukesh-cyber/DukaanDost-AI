#!/usr/bin/env python3
"""
DukaanDost - Smart Server Launcher (dukaandost.db)
Starts the FastAPI Backend and serves the full Interactive WhatsApp & Voice Simulator.
Includes automatic port conflict resolution (avoids WinError 10048).
"""
import os
import sys
import socket
import subprocess
import webbrowser

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def is_port_in_use(port, host="127.0.0.1"):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def kill_process_on_port(port):
    """Kills any stale process occupying the port on Windows/Linux."""
    try:
        if sys.platform.startswith("win"):
            cmd = f"netstat -ano | findstr LISTENING | findstr :{port}"
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            for line in res.stdout.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    if pid and pid != str(os.getpid()):
                        print(f"  [Auto-Fix] Terminating stale process PID {pid} on port {port}...")
                        subprocess.run(f"taskkill /PID {pid} /F", shell=True, capture_output=True)
        else:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)
    except Exception as e:
        print(f"  [Warning] Could not terminate process on port {port}: {e}")

def get_available_port(preferred_port=8000, max_attempts=5):
    if is_port_in_use(preferred_port):
        print(f"  [Notice] Port {preferred_port} is busy. Freeing port...")
        kill_process_on_port(preferred_port)
        import time
        time.sleep(1)

    if not is_port_in_use(preferred_port):
        return preferred_port

    # If still occupied, find next available port
    for p in range(preferred_port + 1, preferred_port + max_attempts + 1):
        if not is_port_in_use(p):
            print(f"  [Notice] Switched to available port {p}")
            return p

    return preferred_port

if __name__ == "__main__":
    import uvicorn

    port = get_available_port(8000)

    print("\n" + "=" * 65)
    print("  [DukaanDost] Voice & WhatsApp FAQ AI for Small Local Shops")
    print("=" * 65)
    print(f"  >> Database:                  dukaandost.db")
    print(f"  >> Interactive Phone Web UI:  http://localhost:{port}")
    print(f"  >> REST API Documentation:    http://localhost:{port}/docs")
    print(f"  >> WhatsApp Webhook Endpoint: http://localhost:{port}/webhook/whatsapp")
    print("=" * 65 + "\n")

    try:
        webbrowser.open(f"http://localhost:{port}")
    except Exception:
        pass

    from main import app
    uvicorn.run(app, host="0.0.0.0", port=port)
