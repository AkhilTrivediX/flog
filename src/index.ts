

const ansi: { [key: string]: number } = {
    reset: 0,
    bold: 1,
    dim: 2,
    faint: 2,
    italic: 3,
    slant: 3,
    underline: 4,
    blinking: 5,
    invert: 7,
    inverse: 7,
    hidden: 8,
    invisible: 8,
    striked: 9,
    strikethrough: 9,
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 94,
    magenta: 35,
    cyan: 36,
    white: 37,
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,
    success: 32,
    info: 34,
    warn: 33,
    error: 31,
};

const func = ['success', 'info', 'warn', 'error'];

const icons: { [key: string]: string } = {
    success: '✅',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
}

export type FlogInstance = {
    (...args: any[]): void;
} & {
    success: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    disableIcons: () => void;
    enableIcons: () => void;
    addPreset: (name: string, style: string) => void;
} & {
    [key in string]: (...args: any[]) => void;
}

function createFLog(): FlogInstance {
    let disableIcons = false;

    const logger: any = (...args: any[]) => console.log(...args);

    func.forEach((key) => {
        logger[key] = (...args: any[]) => {
            const icon = disableIcons ? '' : icons[key] || '';
            console.log(`\x1b[${ansi[key]}m${icon?icon+' ':''}${args.join(' ')}\x1b[${ansi.reset}m`);
        };
    });

    logger.style = (style: string, ...args: any[]) => {
        if (args.length === 0) {
            console.log(style);
            return;
        }
    
        let combined = formatANSI(style);
        
        const styled = args.map(arg => `${combined}${String(arg)}\x1b[${ansi.reset}m`);
        console.log(...styled);
    };

    logger.addPreset = (name: string, style: string) => {
        const ansiStyle = formatANSI(style);
        logger[name] = (...args: any[]) => {
            console.log(`${ansiStyle}${args.join(' ')}\x1b[${ansi.reset}m`);
        };
    }

    logger.disableIcons = () => {
        disableIcons = true;
    }

    logger.enableIcons = () => {
        disableIcons = false;
    }


    return logger;
}

const hexToRGB = (hex: string) => [parseInt(hex.slice(0,2), 16), parseInt(hex.slice(2,4), 16), parseInt(hex.slice(4,6), 16)];

const formatANSI = (style: string)=>{
    let codes: number[] = [];
        let combined = '';
    
        for (const token of style.split(' ')) {
            if (ansi[token]) {
                codes.push(ansi[token]);
            } else if (token.startsWith('\x1b')) {
                combined += token;
            } else if(token.startsWith('hex-')){
                const hex = token.substring(6, token.length-1);
                const [r,g,b] = hexToRGB(hex);
                combined+=`\x1b[38;2;${r};${g};${b}m`;
            } else if(token.startsWith('bgHex-')){
                const hex = token.substring(8, token.length-1);
                const [r,g,b] = hexToRGB(hex);
                combined+=`\x1b[48;2;${r};${g};${b}m`;
            } else if(token.startsWith('rgb-')){
                const [r,g,b] = token.substring(5,token.length-1).split(',');
                combined+=`\x1b[38;2;${r};${g};${b}m`;
            } else if(token.startsWith('bgRgb-')){
                const [r,g,b] = token.substring(7, token.length-1).split(',');
                combined+=`\x1b[48;2;${r};${g};${b}m`;
            }
        }
    
        if (codes.length === 0 && combined === '') {
            return '';
        }

        let strCodes = codes.map(e=>String(e));
    
        if(strCodes.length>0) combined = `\x1b[${strCodes.join(';')}m`+combined;
        return combined;
}


const flog = createFLog();

export default flog;