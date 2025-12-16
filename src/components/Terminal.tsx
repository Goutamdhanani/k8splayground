import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { parseCommand } from '../engines/commandParser';
import { extractIntent } from '../engines/intentEngine';
import { executeIntent } from '../engines/commandExecutor';

interface TerminalProps {
  yamlFiles: Record<string, string>;
}

export function Terminal({ yamlFiles }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const promptRef = useRef<string>('root@k8s-playground:~# ');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln('Welcome to Kubernetes Visual Simulator!');
    term.writeln('Type "help" for available commands.\n');
    term.write(promptRef.current);

    let inputBuffer = '';

    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        term.write('\r\n');
        const command = inputBuffer.trim();
        
        if (command) {
          handleCommand(command, term);
          setCommandHistory((prev) => [...prev, command]);
          setHistoryIndex(-1);
        }
        
        inputBuffer = '';
        term.write(promptRef.current);
      } else if (code === 127) { // Backspace
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code === 27) { // Escape sequences (arrow keys)
        // Handle arrow keys for history navigation
        if (data === '\x1b[A') { // Up arrow
          navigateHistory('up', term, inputBuffer, (newInput) => {
            inputBuffer = newInput;
          });
        } else if (data === '\x1b[B') { // Down arrow
          navigateHistory('down', term, inputBuffer, (newInput) => {
            inputBuffer = newInput;
          });
        }
      } else if (code >= 32) { // Printable characters
        inputBuffer += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const navigateHistory = (
    direction: 'up' | 'down',
    term: XTerm,
    currentBuffer: string,
    updateBuffer: (newInput: string) => void
  ) => {
    if (commandHistory.length === 0) return;

    let newIndex = historyIndex;

    if (direction === 'up') {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1);
      if (newIndex === commandHistory.length - 1) newIndex = -1;
    }

    setHistoryIndex(newIndex);

    // Clear current line
    term.write('\r' + ' '.repeat(promptRef.current.length + currentBuffer.length) + '\r');
    term.write(promptRef.current);

    const newCommand = newIndex === -1 ? '' : commandHistory[newIndex];
    term.write(newCommand);
    updateBuffer(newCommand);
  };

  const handleCommand = (input: string, term: XTerm) => {
    if (input === 'clear') {
      term.clear();
      return;
    }

    const parsed = parseCommand(input);

    if (!parsed) {
      term.writeln(`Command not found: ${input}`);
      term.writeln('Type "help" for available commands.');
      return;
    }

    const intent = extractIntent(parsed);

    if (!intent) {
      term.writeln(`Invalid command syntax: ${input}`);
      return;
    }

    const result = executeIntent(intent, yamlFiles);

    if (result.success) {
      if (result.output) {
        term.writeln(result.output);
      }
    } else {
      term.writeln(`\x1b[31mError: ${result.error}\x1b[0m`);
    }
  };

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
      }}
    />
  );
}
