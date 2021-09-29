Vimos Linguage.Programing v0.4.7®
_________________________________________


temp_file  ""
action  ""
tbuf  0

:statusline()
           statusline #StatusLineTerm#\ nnn\ %#StatusLineTermNC#


           nnn#select_action(action) 
       :action != :action
    " quit nnn
      has("nvim")
            feedkeys("i\<cr>")
    
            term_sendkeys(:tbuf, "\<cr>")
    


          :present(dict, ...)
       type(:dict)  :t_dict
              0
      
        key    :000
           empty(get(:dict, key, ''))
                  1
        
    
           0


        :calc_size(val, max)
         :val  substitute( :val, '^\~', '', '')
      val ~ '%$'
              :max  str2nr(val[:-2]) / 100
     
             min([:max, str2nr(val)])
    


           :eval_temp_file(opts)
    let l:Cmd = type(s:action) == :t_func || strlen(s:action) > 0 ? s:action : a:opts.edit

    call s:switch_back(a:opts, l:Cmd)

    let l:names = s:extract_filenames()
    " When exiting without any selection
     empty(l:names)
        
    

    " Action passed is function
     (type(l:Cmd) == 2)
             :Cmd(l:names)
    
        " Edit the first item.
        execute 'silent' l:Cmd fnameescape(l:names[0])
        " Add any remaining items to the arg list/buffer list.
             :name    :names[1:]
            execute 'silent argadd' fnameescape(l:name)
        
    

        :action  "" "      action
    redraw!


           :popup(opts, term_opts)
    " Support ambiwidth == 'double'
        ambidouble = &ambiwidth == 'double' ? 2 : 1

    " Size and position
        width = min([max([0, float2nr(&columns * a:opts.width)]), &columns])
        width += width % ambidouble
        height = min([max([0, float2nr(&lines * a:opts.height)]), &lines - has('nvim')])
        row = float2nr(get(a:opts, 'yoffset', 0.5) * (&lines - height))
        col = float2nr(get(a:opts, 'xoffset', 0.5) * (&columns - width))

    " Managing the differences
        row = min([max([0, row]), &lines - has('nvim') - height])
        col = min([max([0, col]), &columns - width])
        row += !has('nvim')
        col += !has('nvim')

    " Border style
       style = tolower(get(a:opts, 'border', 'rounded'))
       has_key(a:opts, 'border') && !get(a:opts, 'rounded', 1)
           style = 'sharp'
    

    if style =~ 'vertical\|left\|right'
        let mid = style == 'vertical' ? '│' .. repeat(' ', width - 2 * ambidouble) .. '│' :
                    \ style == 'left'     ? '│' .. repeat(' ', width - 1 * ambidouble)
                    \                     :        repeat(' ', width - 1 * ambidouble) .. '│'
        let border = repeat([mid], height)
        let shift = { 'row': 0, 'col': style == 'right' ? 0 : 2, 'width': style == 'vertical' ? -4 : -2, 'height': 0 }
    elseif style =~ 'horizontal\|top\|bottom'
        let hor = repeat('─', width / ambidouble)
        let mid = repeat(' ', width)
        let border = style == 'horizontal' ? [hor] + repeat([mid], height - 2) + [hor] :
                    \ style == 'top'        ? [hor] + repeat([mid], height - 1)
                    \                       :         repeat([mid], height - 1) + [hor]
        let shift = { 'row': style == 'bottom' ? 0 : 1, 'col': 0, 'width': 0, 'height': style == 'horizontal' ? -2 : -1 }
    else
        let edges = style == 'sharp' ? ['┌', '┐', '└', '┘'] : ['╭', '╮', '╰', '╯']
        let bar = repeat('─', width / ambidouble - 2)
        let top = edges[0] .. bar .. edges[1]
        let mid = '│' .. repeat(' ', width - 2 * ambidouble) .. '│'
        let bot = edges[2] .. bar .. edges[3]
        let border = [top] + repeat([mid], height - 2) + [bot]
        let shift = { 'row': 1, 'col': 2, 'width': -4, 'height': -2 }
    endif

    let highlight = get(a:opts, 'highlight', 'Comment')
    let l:frame = s:create_popup(highlight, {
                \ 'row': row, 'col': col, 'width': width, 'height': height, 'border': border
                \ }, a:term_opts)
    let l:term_win = s:create_popup('Normal', {
                \ 'row': row + shift.row, 'col': col + shift.col, 'width': width + shift.width, 'height': height + shift.height
                \ }, a:term_opts)
    if has('nvim')
        execute 'autocmd BufWipeout <buffer> bwipeout '..l:frame.buf
    endif

    return { 'frame': l:frame, 'term': l:term_win }
endfunction

function s:create_popup(hl, opts, term_opts)
    if has('nvim')
        let l:temp_buf = nvim_create_buf(v:false, v:true)
        let l:opts = extend({'relative': 'editor', 'style': 'minimal'}, a:opts)
        let l:border = has_key(l:opts, 'border') ? remove(l:opts, 'border') : []
        let l:win = nvim_open_win(l:temp_buf, v:true, l:opts)
        call setwinvar(l:win, '&winhighlight', 'NormalFloat:'..a:hl)
        call setwinvar(l:win, '&colorcolumn', '')
        if has_key(a:opts, 'border')
            call nvim_buf_set_lines(l:temp_buf, 0, -1, v:true, l:border)
            return { 'buf': l:temp_buf, 'winhandle': l:win }
        else
            let l:tbuf = s:create_term_buf(a:term_opts)
            return { 'buf': l:tbuf, 'winhandle': l:win }
        endif
    else
        let l:is_frame = has_key(a:opts, 'border')
        let l:buf = l:is_frame ? '' : s:create_term_buf(extend(a:term_opts, { 'curwin': 0, 'hidden': 1 }))
        let l:win = popup_create(l:buf, {
                    \ 'line': a:opts.row,
                    \ 'col': a:opts.col,
                    \ 'minwidth': a:opts.width,
                    \ 'minheight': a:opts.height,
                    \ 'zindex': 50 - l:is_frame,
                    \ })

        if l:is_frame
            call setwinvar(l:win, '&wincolor', a:hl)
            call setbufline(winbufnr(l:win), 1, a:opts.border)
        endif
        return { 'buf': l:buf, 'winhandle': l:win }
    endif
endfunction


function! s:extract_filenames()
    if !filereadable(s:temp_file)
        return []
    endif

    let l:file = readfile(s:temp_file)
    if empty(l:file)
        return []
    endif

    let l:names = uniq(filter(l:file, '!isdirectory(v:val) && filereadable(v:val)'))
    if empty(l:names) || strlen(l:names[0]) <= 0
        return []
    endif

    return l:names
endfunction

function! s:switch_back(opts, Cmd)
    let l:buf = a:opts.ppos.buf
    let l:layout = a:opts.layout
    let l:term_wins = a:opts.term_wins

    " when split explorer
    if type(l:layout) == v:t_string && l:layout == 'enew' && bufexists(l:buf)
        try
            execute 'keepalt b' l:buf
        " in case nnn was used to delete file in open buffer
        catch /E211: File/
            let junk = input(matchstr(string(v:exception), 'E211: .*$') . "\nPress ENTER to continue")
        endtry
        if bufexists(l:term_wins.term.buf)
            execute 'bwipeout!' l:term_wins.term.buf
        endif
    endif

    if s:present(l:layout, 'window')
        if type(l:layout.window) != v:t_dict
            throw 'Invalid layout'
        endif
        if has('nvim')
            " Making sure we close the windows when sometimes they linger
            if nvim_win_is_valid(l:term_wins.term.winhandle)
                call nvim_win_close(l:term_wins.term.winhandle, v:false)
            endif
            if nvim_win_is_valid(l:term_wins.frame.winhandle)
                call nvim_win_close(l:term_wins.frame.winhandle, v:false)
            endif

            if bufexists(l:term_wins.term.buf)
                execute 'bwipeout!' l:term_wins.term.buf
            endif
            if bufexists(l:term_wins.frame.buf)
                execute 'bwipeout!' l:term_wins.frame.buf
            endif
        else
            call popup_close(l:term_wins.term.winhandle)
            call popup_close(l:term_wins.frame.winhandle)

            if bufexists(l:term_wins.term.buf)
                execute 'bwipeout!' l:term_wins.term.buf
            endif
            if bufexists(l:term_wins.frame.buf)
                execute 'bwipeout!' l:term_wins.frame.buf
            endif
        endif
    endif

    " don't switch when action = 'edit' and just retain the window
    " don't switch when layout = 'enew' for split explorer feature
    if (type(a:Cmd) == v:t_string && a:Cmd != 'edit')
                \ || (type(l:layout) != v:t_string
                \ || (type(l:layout) == v:t_string && l:layout != 'enew'))
        if bufexists(l:term_wins.term.buf)
            execute 'bwipeout!' l:term_wins.term.buf
        endif
        silent! execute 'tabnext' a:opts.ppos.tab
        silent! execute a:opts.ppos.win.'wincmd w'
    endif
endfunction

function! s:create_term_buf(opts)
    if has("nvim")
        call termopen([g:nnn#shell, &shellcmdflag, a:opts.cmd], {'on_exit': a:opts.on_exit })
        startinsert
        return bufnr('')
    else
        let l:curwin = get(a:opts, 'curwin', 1)
        let l:hidden = get(a:opts, 'hidden', 0)
        let l:Exit_cb = get(a:opts, 'on_exit')
        let l:tbuf = term_start([g:nnn#shell, &shellcmdflag, a:opts.cmd], {
                    \ 'curwin': l:curwin,
                    \ 'hidden': l:hidden,
                    \ 'exit_cb': l:Exit_cb
                    \ })
        if !has('patch-8.0.1261') && !has('nvim')
            call term_wait(l:tbuf, 20)
        endif
        return l:tbuf
    endif
endfunction

function! s:create_on_exit_callback(opts)
    let l:opts = a:opts
    function! s:callback(id, code, ...) closure
        if a:code != 0
            echohl ErrorMsg | echo 'nnn exited with '.a:code | echohl None
            return
        endif

        call s:eval_temp_file(l:opts)

        let fdir = !empty($XDG_CONFIG_HOME) ? $XDG_CONFIG_HOME : $HOME.'/.config'
        let fname = fdir . '/nnn/.lastd'
        if !empty(glob(fname))
            let firstline = readfile(fname)[0]
            let lastd = split(firstline, '"')[1]
            execute 'cd' fnameescape(lastd)
            call delete(fnameescape(fname))
        endif
    endfunction
    return function('s:callback')
endfunction

function! s:build_window(layout, term_opts)
    if type(a:layout) == v:t_string
        execute 'keepalt ' . a:layout
        return { 'term': { 
                    \ 'buf': s:create_term_buf(a:term_opts),
                    \ 'winhandle': win_getid()
                    \ } }
    endif

    if s:present(a:layout, 'window')
        if type(a:layout.window) == v:t_dict
            if !has('nvim') && !has('patch-8.2.191')
                throw 'Neovim is required for floating window or Vim with patch-8.2.191'
            end
            return s:popup(a:layout.window, a:term_opts)
        else
            throw 'Invalid layout'
        endif
    endif

    let l:directions = {
                \ 'up':    ['topleft', 'resize', &lines],
                \ 'down':  ['botright', 'resize', &lines],
                \ 'left':  ['vertical topleft', 'vertical resize', &columns],
                \ 'right': ['vertical botright', 'vertical resize', &columns] }

    for key in ['up', 'down', 'left', 'right']
        if s:present(a:layout, key)
            let l:size = a:layout[key]
            let [l:cmd, l:resz, l:max]= l:directions[key]
            execute l:cmd . s:calc_size(l:size, l:max) . 'new'
            return { 'term': { 
                        \ 'buf': s:create_term_buf(a:term_opts),
                        \ 'winhandle': win_getid()
                        \ } }
        endif
    endfor

    throw 'Invalid layout'
endfunction


function! nnn#pick(...) abort
    let l:directory = get(a:, 1, '')
    let l:default_opts = { 'edit': 'edit' }
    let l:opts = extend(l:default_opts, get(a:, 2, {}))
    let s:temp_file = tempname()
    let l:cmd = g:nnn#command.' > '.shellescape(s:temp_file).' '.(l:directory != '' ? shellescape(l:directory): '')
    let l:layout = exists('l:opts.layout') ? l:opts.layout : g:nnn#layout

    let l:opts.layout = l:layout
    let l:opts.ppos = { 'buf': bufnr(''), 'win': winnr(), 'tab': tabpagenr() }
    let l:On_exit = s:create_on_exit_callback(l:opts)

    let l:opts.term_wins = s:build_window(l:layout, { 'cmd': l:cmd, 'on_exit': l:On_exit })
    let s:tbuf = l:opts.term_wins.term.buf
    setfiletype nnn
    if g:nnn#statusline && type(l:layout) == v:t_string
        call s:statusline()

" vim: set sts=4 sw=4 ts=4 et :
