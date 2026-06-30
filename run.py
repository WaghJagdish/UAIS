import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8501
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

class MyTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def open_browser():
    # Wait a moment for the server to spin up
    time.sleep(1.0)
    url = f"http://localhost:{PORT}"
    print(f"Opening browser at {url}...")
    webbrowser.open_new_tab(url)

if __name__ == "__main__":
    # Start browser thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    print(f"Starting server in directory: {DIRECTORY}")
    try:
        with MyTCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"Server active at http://localhost:{PORT} (Press Ctrl+C to terminate)")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer terminated by operator.")
    except Exception as e:
        print(f"Error starting server: {e}")
