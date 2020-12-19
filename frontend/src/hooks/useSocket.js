import { useEffect } from 'react'
import { socketRecoil, workspaceRecoil } from '../store'
import { useParams } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import { isEmpty } from '../util'
import { SOCKET_EVENT } from '../constant'
import io from 'socket.io-client'
import useChannelInfo from './useChannelInfo'
import useChannelList from './useChannelList'

const baseURL =
  process.env.NODE_ENV === 'development'
    ? process.env.REACT_APP_DEV_CHAT_HOST
    : process.env.REACT_APP_CHAT_HOST

const useSocket = () => {
  const { workspaceId } = useParams()
  const workspaceUserInfo = useRecoilValue(workspaceRecoil)
  const [socket, setSocket] = useRecoilState(socketRecoil)
  const [channelList, setChannels] = useChannelList()
  const [channelInfo, updateChannelInfo] = useChannelInfo()

  useEffect(() => {
    if (workspaceId && workspaceUserInfo) {
      setSocket(
        io(`${baseURL}/${workspaceId}`, {
          query: {
            workspaceId,
            workspaceUserInfoId: workspaceUserInfo._id,
          },
        }),
      )
    }
  }, [workspaceId, workspaceUserInfo])

  useEffect(() => {
    if (socket && !isEmpty(channelList)) {
      socket.emit(
        SOCKET_EVENT.JOIN_ROOM,
        channelList.map(channel => channel.channelId._id),
      )
      socket.on(SOCKET_EVENT.INVITED_CHANNEL, ({ channelId, newMember }) => {
        if (channelId === channelInfo.channelId._id)
          updateChannelInfo(channelId)
        if (newMember === workspaceUserInfo._id) setChannels()
      })
    }
    return () => {
      if (socket)
        socket.emit(
          SOCKET_EVENT.LEAVE_ROOM,
          channelList.map(channel => channel.channelId._id),
        )
    }
  }, [socket, channelList])

  useEffect(() => {
    if (socket && !isEmpty(channelInfo) && !isEmpty(workspaceUserInfo)) {
      socket.on(SOCKET_EVENT.INVITED_CHANNEL, ({ channelId, newMember }) => {
        if (channelId === channelInfo.channelId._id)
          updateChannelInfo(channelId)
        if (newMember.includes(workspaceUserInfo._id)) setChannels()
      })
    }
    return () => {
      if (socket) socket.off(SOCKET_EVENT.INVITED_CHANNEL)
    }
  }, [socket, channelInfo, workspaceUserInfo])

  return [socket]
}

export default useSocket
