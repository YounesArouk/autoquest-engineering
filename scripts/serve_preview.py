"""Serve the prebuilt demo without Node.js or npm. Python standard library."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse
import threading
import webbrowser
import socket

def main():
 root=Path(__file__).resolve().parents[1]
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--directory',default='preview');parser.add_argument('--port',type=int,default=3000)
 parser.add_argument('--host',default='0.0.0.0');parser.add_argument('--no-browser',action='store_true')
 args=parser.parse_args();directory=(root/args.directory).resolve()
 if not (directory/'index.html').is_file():raise SystemExit('Missing preview/index.html. Extract the entire ZIP, or use --directory out after npm run build.')
 class Handler(SimpleHTTPRequestHandler):
  extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'}
  def end_headers(self):
   self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
 try:server=ThreadingHTTPServer((args.host,args.port),partial(Handler,directory=str(directory)))
 except OSError as e:raise SystemExit(f'Cannot start on port {args.port}: {e}. Try --port 3001.')
 url=f'http://localhost:{args.port}/'
 print('\nAutoQuest | Demo locale / Local demo\n'+url)
 try:ip=socket.gethostbyname(socket.gethostname());print(f'Meme Wi-Fi / Same Wi-Fi: http://{ip}:{args.port}/')
 except OSError:pass
 print('Ctrl+C pour arreter / to stop.\n')
 if not args.no_browser:threading.Timer(.8,lambda:webbrowser.open(url)).start()
 try:server.serve_forever()
 except KeyboardInterrupt:print('\nAu revoir / See you soon.')
 finally:server.server_close()

if __name__=='__main__':main()
