import { userSocketIds } from "../app.js";

const emitEvent=(req, event, users, data)=>{
    console.log("Emiting eVENT", event);
    
};
export {emitEvent}

export const getSockets=(users=[])=>{
    const sockets=users.map((user)=> userSocketIds
    .get(user._id.toString()))
    return sockets
}