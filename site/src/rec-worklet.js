// Studio recorder: copies the microphone input on the audio thread, so a busy page can't drop or repeat samples
// (the ScriptProcessorNode it replaces did, which sounded like crackle). Posts batches of 2048 frames with the
// context time of their first frame; 'stop' ends the processor.
class BabbleRecorder extends AudioWorkletProcessor{
  constructor(){
    super();this.buf=new Float32Array(2048);this.n=0;this.t=0;this.on=true;
    this.port.onmessage=e=>{if(e.data==='stop')this.on=false};
  }
  send(){if(this.n){this.port.postMessage({t:this.t,d:this.buf.slice(0,this.n)});this.n=0}}
  process(inputs){
    if(!this.on)return false;
    const ch=inputs[0]&&inputs[0][0];if(!ch)return true;
    for(let i=0;i<ch.length;i++){
      if(this.n===0)this.t=currentTime+i/sampleRate;
      this.buf[this.n++]=ch[i];if(this.n===this.buf.length)this.send();
    }
    return true;
  }
}
registerProcessor('babble-recorder',BabbleRecorder);
