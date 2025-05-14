import readline from 'readline'

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
    let LoaderManager: {id: string, msg: string, promiseStatus?: number[], loaderLength?: number}[] = [];
    let tickInterval = 100;
    let ticking = false;
    let tickFrames = 0;

    const logger: any = (...args: any[]) => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log(...args);
    }

    func.forEach((key) => {
        logger[key] = (...args: any[]) => {
            const icon = disableIcons ? '' : icons[key] || '';
            logger(`\x1b[${ansi[key]}m${icon?icon+' ':''}${args.join(' ')}\x1b[${ansi.reset}m`);
        };
    });


    logger.loader = (promise: Promise<any> | Promise<any>[], loadingMsg: string, successMsg?: string, errorMsg?: string) => {
        let id = crypto.randomUUID();
        LoaderManager.push({id, msg: loadingMsg, ...(Array.isArray(promise)?{promiseStatus: Array(promise.length).fill('_').map(_=>0), loaderLength: 0}:{})});

        if(!ticking) {
            tick();
            ticking = true;
        }

        if(Array.isArray(promise))
        {

            let isThereAnyReject = false;
             return Promise.all(promise.map((p, i)=>{
                return p.then((obj)=>{
                    if(!LoaderManager.find((p)=>p.id==id)) return obj; 
                    const pStatus = LoaderManager.find(x=>x.id==id)!.promiseStatus!
                    pStatus[pStatus.findIndex((x,i)=>x==0)] = 1;
                    return obj
                }, (obj)=>{
                    if(promise.length>10) isThereAnyReject = true;
                    if(!LoaderManager.find((p)=>p.id==id)) return obj; 
                    const pStatus = LoaderManager.find(x=>x.id==id)!.promiseStatus!
                    pStatus[pStatus.findIndex((x,i)=>x==0)] = -1;
                    return obj
                })
            })).then(async res=>{
                if(!LoaderManager.find((p)=>p.id==id)) return;
                const obj = LoaderManager.find(x=>x.id==id)!;
                    LoaderManager = LoaderManager.filter((item)=>item.id!==id)
                    if(!obj.loaderLength) obj.loaderLength = 0;
                    logger('✅',generatePercentageString(obj.promiseStatus!, 9, isThereAnyReject).str, obj.msg);
                    return res;
            })
        }
        else{
                return promise.then((obj)=>{
                if(!LoaderManager.find((p)=>p.id==id)) return obj; 
                LoaderManager = LoaderManager.filter((item)=>item.id!==id);
                let ret = 'SUCCESS: '+loadingMsg;
                if(successMsg) ret = successMsg;
                if(obj && obj.flog) ret = obj.flog;
                logger.success(ret);
                return obj
            },(obj)=>{
                if(!LoaderManager.find((p)=>p.id==id)) return obj;
                LoaderManager = LoaderManager.filter((item)=>item.id!==id);
                let ret = 'FAILED: '+loadingMsg;
                if(errorMsg) ret = errorMsg;
                if(obj && obj.flog) ret = obj.flog;
                logger.error(ret);
                return obj;
            })
        }
    }

    const loaderFrames =  [
			"⢎ ",
			"⠎⠁",
			"⠊⠑",
			"⠈⠱",
			" ⡱",
			"⢀⡰",
			"⢄⡠",
			"⢆⡀"
		]

    function tick(){
        tickFrames = (tickFrames+1)%60;
        LoaderManager.forEach((obj)=>{
            if(!obj.promiseStatus) logger(loaderFrames[tickFrames%loaderFrames.length], obj.msg);
            else{
                if(!obj.loaderLength) obj.loaderLength = 0;
                const ret = generatePercentageString(obj.promiseStatus, obj.loaderLength);
                const str = ret.str;
                obj.loaderLength = ret.loaderLength;
                logger(loaderFrames[tickFrames%loaderFrames.length],str, obj.msg);
            }
        })
        console.log(`\x1b[${LoaderManager.length+1}A`)

        if(LoaderManager.length>0)setTimeout(tick, tickInterval);
        else ticking = false;
    }


    logger.style = (style: string, ...args: any[]) => {
        if (args.length === 0) {
            logger(style);
            return;
        }
    
        let combined = formatANSI(style);
        
        const styled = args.map(arg => `${combined}${String(arg)}\x1b[${ansi.reset}m`);
        logger(...styled);
    };

    logger.addPreset = (name: string, style: string) => {
        const ansiStyle = formatANSI(style);
        logger[name] = (...args: any[]) => {
            logger(`${ansiStyle}${args.join(' ')}\x1b[${ansi.reset}m`);
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

function generatePercentageString(promiseStatus: number[], loaderLength: number, addRejectAtEnd?:boolean){
    const tenArr = scaleArray(promiseStatus, 10).filter(x=>x!=0);
    if(addRejectAtEnd) tenArr[9] = -1;
                if(tenArr.length>loaderLength){
                     loaderLength++;
                }
                let str = '[';
                for(let i=0; i<loaderLength; i++){
                    str+= '\x1b[' +(tenArr[i]==1?ansi.green:ansi.red) + 'm██';
                }                               
                str+='\x1b[0m'
                
                for(let i=loaderLength; i<10; i++){
                    str+='██'
                }
                str+='] '+Math.round(tenArr.length*10)+'%';
                return {str, loaderLength}
}

function scaleArray(oldArray:number[], newSize:number) {
    const oldSize = oldArray.length;
    const newArray = new Array(newSize);

    for (let j = 0; j < newSize; j++) {
        // Determine the range in the original array that maps to this index
        const start = j * oldSize / newSize;
        const end = (j + 1) * oldSize / newSize;

        // Collect overlapping indices
        const startIndex = Math.floor(start);
        const endIndex = Math.ceil(end);

        const values = [];
        for (let i = startIndex; i < endIndex; i++) {
            if (i >= 0 && i < oldSize) {
                values.push(oldArray[i]);
            }
        }

        // Conflict resolution: true > false > null
        if (values.includes(1)) {
            newArray[j] = 1;
        } else if (values.includes(-1)) {
            newArray[j] = -1;
        } else {
            newArray[j] = 0;
        }
    }

    return newArray;
}