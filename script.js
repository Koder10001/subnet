abortSignal = false;
workingOnJob = false;

function update(ip = undefined){

    let ipDOM = document.querySelectorAll("#ip > input");
    let ipBinary = document.querySelectorAll("#ipBinary > input");
    let ipClass = document.querySelector("#ipClass")


    // update class, subnet mask and disable correct subnet mask

    let classBit = getClassBit();

    switch (classBit){
        case 8:
            ipClass.innerText = "Class A, 8 bit for network";
            break;
        case 16:
            ipClass.innerText = "Class B, 16 bit for network"
            break;
        case 24:
            ipClass.innerText = "Class C, 24 bit for network";
            break;
        default:
            ipClass.innerText = "IDK what to do here brother";
            break;
    }
    
    if(ip){
        ip = ip.split(".");
        for(let i = 0; i < 4; i++){
            ipDOM[i].value = parseInt(ip[i]);
        }
    }

    //to binary
    for(let i = 0 ; i < 4 ; i++){ // because 4 octet
        ipBinary[i].value = toBinary(parseInt(ipDOM[i].value));
    }

    if(ip == undefined){
        updateSubnetMask(classBit, true)
    }

    updateNetworkID();

    updateBroadcastIP();

}

async function updateSubnetMask(bit, isDisable = false){

    if(workingOnJob){
        abortSignal = true;
        await sleep(200);
        updateSubnetMask(bit, isDisable);
        return;
    }
    
    let subnetMask = document.querySelectorAll("#subnetMask > select");
    let subnetMaskBinary = document.querySelectorAll("#subnetMaskBinary > input");

    let i;
    for(i = 0; i < 4; i++){
        console.log(bit);
        if(bit >= 0){
            if(bit >= 8){
                subnetMask[i].selectedIndex = 8;
                if(isDisable){
                    subnetMask[i].disabled = true;
                }
            }
            else{
                subnetMask[i].selectedIndex = bit;
                subnetMask[i].disabled = false;
            }
        }
        else {
            subnetMask[i].selectedIndex = 0;
            subnetMask[i].disabled = false;
        }
        subnetMaskBinary[i].value = toBinary(subnetMask[i].value);
        bit -= 8;
    }

    clearTable();
    listSubnets();
    updateNetworkID();
    updateBroadcastIP();

}

function updateNetworkID(){
    let IPs = document.querySelectorAll("#ip > input");

    let subnets = document.querySelectorAll("#subnetMask > select");

    networkIDs = document.querySelectorAll("#networkID > input")
    networkIDBinaries = document.querySelectorAll("#networkIDBinary > input");

    console.log(networkIDBinaries);
    for(let i = 0; i < 4; i++){

        let val = IPs[i].value & subnets[i].value
        networkIDs[i].value = val;
        networkIDBinaries[i].value = toBinary(val);

    }

}

function updateBroadcastIP(){

    let networkID = document.querySelectorAll("#networkID > input");
    let broadcastIP = document.querySelectorAll("#broadcastIP > input");
    let broadcastIPBinary = document.querySelectorAll("#broadcastIPBinary > input");

    let numOfNetworkBits = getNetworkBits();

    let networkIDBinary = ""

    for( let i = 0; i < 4; i++){

        networkIDBinary += toBinary(networkID[i].value);

    }

    networkIDBinary = networkIDBinary.split("");

    for( let i = 32; i >= numOfNetworkBits; i--){
        networkIDBinary[i] = "1";
    }

    networkIDBinary = networkIDBinary.join("");


    for(let i = 0 ; i < 4; i++){
        let tmpBin = ""
        for( let j = 0; j < 8; j++){
            tmpBin += networkIDBinary[ 8*i + j ];
        }
        broadcastIP[i].value = toDecimal(tmpBin);
        broadcastIPBinary[i].value = tmpBin;
    }

}

async function listSubnets(){

    let ipBinaryDOM = document.querySelectorAll("#ipBinary > input");
    let subnetMaskBinaryDOM = document.querySelectorAll("#subnetMaskBinary > input");

    let numOfClassBits = getClassBit()
    let numOfSubnetBits = getNetworkBits() - numOfClassBits;

    let ipBinary = "";
    let subnetMaskBinary = "";


    for(let i = 0 ; i < 4; i++ ){

        ipBinary += ipBinaryDOM[i].value;
        subnetMaskBinary += subnetMaskBinaryDOM[i].value;

    }

    let classBits = ipBinary.slice(0, numOfClassBits);
    
    for ( let i = 0 ; i < Math.pow(2,numOfSubnetBits); i++){

        workingOnJob = true;
        if(abortSignal){
            abortSignal = false;
            break;
        }

        let subnetBits = toBinary(i, numOfSubnetBits);

        let networkIDBits = ""
        let broadcastIPBits = ""

        for(let remainingBits = 0; remainingBits < 32 - numOfClassBits - numOfSubnetBits; remainingBits++){
            networkIDBits += "0";
            broadcastIPBits += "1";
        }

        let networkBits = classBits + subnetBits;

        let min = networkIDBits
        let max = broadcastIPBits
        min = min.split("");
        max = max.split("");
        min[min.length - 1] = "1"
        max[max.length - 1] = "0"
        min = min.join("")
        max = max.join("")
        
        appendTable(networkBits + networkIDBits, networkBits + broadcastIPBits, networkBits + min, networkBits + max)
        await sleep(50);
    }
    workingOnJob = false;

}

function removeBits(bin, numOfBitsToKeep){

    bin = bin + "";
    let str = "";

    for(let i = 0; i < numOfBitsToKeep; i++){

        str = bin[7-i] + str;

    }   

    return str;
}

function getClassBit(){

    let ipDOM = document.querySelector("#ip > input");
    let classBit;

    if(ipDOM.value > 0 && ipDOM.value < 127 ){ // class A
        classBit = 8;
    }
    else if (ipDOM.value > 127 && ipDOM.value < 192){ //class B
        classBit = 16;
    }
    else if (ipDOM.value < 224){
        classBit = 24;
    }
    else {
        classBit = 32;
    }

    return classBit;

}

function getNetworkBits(){
    let subnetMaskBinary = document.querySelectorAll("#subnetMaskBinary > input");

    let numOfBits = 0;

    for(let i = 0 ; i < 4; i++){

        let str = subnetMaskBinary[i].value + "";
        for(let j = 0 ; j < 8; j++){
            numOfBits += parseInt(str[j])
        }

    }

    return numOfBits;

}

function toBinary(num, len = 8){
    let bin = "";
    // let flag = [128,64,32,16,8,4,2,1];

    for(let i = 0; i < len; i++){ // because 8 bit

        bitValue = Math.pow(2, len - i - 1)
        if(num >= bitValue){
            // num -= flag[i];
            num -= bitValue
            bin += "1"
        }
        else {
            bin += 0;
        }
    }
    return bin;
}

function toDecimal(bin){
    bin = bin + "";
    let num = 0;
    for(let i = 0; i < 8; i++){
        num += parseInt(bin[i]) * Math.pow( 2 , 7 - i );
    }
    return num;
}

function bitsToIP(bits){
    let ip = "";
    for(let i = 0; i < 4;i++){
        ip += toDecimal(bits.slice(i*8, 8+i*8));
        if(i!=3){
            ip += "."
        }
        
    }
    return ip;
}

function appendTable(network, broadcast, min, max){
    let table = document.querySelector("#IPTable > tbody");

    let tr = document.createElement("tr");
    tr.onclick = ()=>{
        update(bitsToIP(min));
    }
    let net = document.createElement("td");
    net.innerText = bitsToIP(network);
    let broad = document.createElement("td");
    broad.innerText = bitsToIP(broadcast);
    let range = document.createElement("td");
    range.innerHTML = bitsToIP(min) + " - " + bitsToIP(max);

    tr.appendChild(net);
    tr.appendChild(broad);
    tr.appendChild(range);

    table.appendChild(tr);


    // table.innerHTML += 
    // `<tr onclick="setTimeout(update,50,'${bitsToIP(network)}')">
    //     <td>${bitsToIP(network)}</td>
    //     <td>${bitsToIP(broadcast)}</td>
    //     <td>${bitsToIP(min)} - ${bitsToIP(max)}</td>
    // </tr>`
}

function clearTable(){
    let table = document.querySelector("#IPTable > tbody");

    table.innerHTML = `
    <tr>
        <th>Network ID</th>
        <th>Broadcast IP</th>
        <th>Range</th>
    </tr>
          `;
}

function sleep(ms){
    return new Promise((res,rej)=>{
        setTimeout(()=>{res()},ms);
    });
}

window.onload = ()=>{
    update();
}