
let { data, error } = await supabase
  .rpc('get_pg_enum_labels')
if (error) console.error(error)
else console.log(data)
