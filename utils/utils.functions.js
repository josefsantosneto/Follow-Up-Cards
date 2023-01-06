const dateAdjust = (date)=>{
    const vDate = new Date(date.setDate(date.getDate()));
    return vDate

}


module.exports = { dateAdjust }